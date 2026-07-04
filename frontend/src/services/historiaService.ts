import type { Contract } from "ethers";
import { getReadContract, getReadOro } from "./contractService";

export interface Hito {
  nombre: string;
  registradoPor: string;
  timestamp: number;
  campos: Record<string, string>;
  txHash?: string; // hash de la transacción que registró este hito (para el link al explorer)
}

export interface Historia {
  tokenId: string;
  owner: string | null;
  etapa: number;
  hitos: Hito[];
}

// Busca en los eventos del contrato la transacción que registró un hito
// puntual (cada evento tiene tokenId indexado). Si el RPC público no puede
// resolver el filtro (o el contrato no emitió ese evento), no rompe la
// página: simplemente ese hito queda sin link al explorer.
async function buscarTxHash(
  contract: Contract,
  nombreEvento: string,
  tokenId: bigint,
): Promise<string | undefined> {
  try {
    const filtro = contract.filters[nombreEvento](tokenId);
    const eventos = await contract.queryFilter(filtro);
    return eventos.length > 0 ? eventos[eventos.length - 1].transactionHash : undefined;
  } catch {
    return undefined;
  }
}

// Lee la historia completa de una pieza (todos los hitos registrados).
// Combina las DOS ramas: la gema (contrato ERC-721) y el oro (contrato ERC-20).
// No requiere wallet: es de solo lectura, accesible por cualquiera.
export async function getHistoria(tokenId: string): Promise<Historia> {
  const contract = getReadContract();
  const id = BigInt(tokenId);

  let owner: string | null = null;
  try {
    owner = await contract.ownerOf(id);
  } catch {
    owner = null; // el token no existe
  }

  const etapa = owner ? Number(await contract.getEtapaActual(id)) : 0;
  const hitos: Hito[] = [];

  // 1. Extracción de la gema (Minera)
  const ex = await contract.extracciones(id);
  if (ex.timestamp > 0n) {
    hitos.push({
      nombre: "1. Extracción de gema (Minera)",
      registradoPor: ex.registradoPor,
      timestamp: Number(ex.timestamp),
      campos: {
        "ID lote": ex.idLote,
        "Gema en bruto": ex.tipoGemaBruta,
        "Peso bruto (centiquilates)": ex.pesoBrutoCentiquilates.toString(),
        Responsable: ex.responsable,
        "Estado inicial": ex.estadoInicial,
      },
      txHash: await buscarTxHash(contract, "GemaCreada", id),
    });
  }

  // 2. Tallado
  const ta = await contract.tallados(id);
  if (ta.timestamp > 0n) {
    hitos.push({
      nombre: "2. Tallado",
      registradoPor: ta.registradoPor,
      timestamp: Number(ta.timestamp),
      campos: {
        "Lote de gema": ta.idLoteGema,
        "Tipo de corte": ta.tipoCorte,
        "Peso (centiquilates)": ta.pesoCentiquilates.toString(),
        "Cantidad de piezas": ta.cantidadPiezas.toString(),
      },
      txHash: await buscarTxHash(contract, "TalladoRegistrado", id),
    });
  }

  // 3. Certificación (GIA)
  const ce = await contract.certificaciones(id);
  if (ce.timestamp > 0n) {
    hitos.push({
      nombre: "3. Certificación (GIA)",
      registradoPor: ce.registradoPor,
      timestamp: Number(ce.timestamp),
      campos: {
        Claridad: ce.claridad,
        Color: ce.color,
        Cut: ce.cut,
        "Peso exacto (centiquilates)": ce.pesoExactoCentiquilates.toString(),
        "N° certificado": ce.numeroCertificado,
        "Hash IPFS": ce.hashCertificadoIPFS,
      },
      txHash: await buscarTxHash(contract, "CertificacionRegistrada", id),
    });
  }

  // 4. Ensamblado (Marca) — CONVERGENCIA con la rama del oro.
  const en = await contract.getEnsamblado(id);
  if (en.timestamp > 0n) {
    const oroRef = await contract.getOroDeEnsamblado(id);

    // Rama del oro: leemos el lote referenciado en el contrato OroToken.
    if (oroRef.idLoteOro && oroRef.idLoteOro.length > 0) {
      try {
        const oro = getReadOro();
        const lote = await oro.getLote(oroRef.idLoteOro);

        hitos.push({
          nombre: "· Origen del oro (Minera)",
          registradoPor: lote.minera,
          timestamp: Number(lote.timestampExtraccion),
          campos: {
            "ID lote de oro": lote.idLote,
            "Mineral bruto": lote.tipoMineralBruto,
            "Peso bruto (mg)": lote.pesoBrutoMg.toString(),
            Responsable: lote.responsable,
          },
        });

        if (lote.refinado) {
          hitos.push({
            nombre: "· Refinado del oro (Refinería)",
            registradoPor: lote.refineria,
            timestamp: Number(lote.timestampRefinado),
            campos: {
              Método: lote.metodo,
              "Peso post (mg)": lote.pesoPostMg.toString(),
              "Ley (milésimas)": lote.leyMilesimas.toString(),
            },
          });
        }
      } catch {
        // Si el contrato del oro no está configurado, seguimos sin la rama del oro.
      }
    }

    hitos.push({
      nombre: "4. Ensamblado (Marca)",
      registradoPor: en.registradoPor,
      timestamp: Number(en.timestamp),
      campos: {
        SKU: en.sku,
        "Metal de soporte": en.metalSoporte,
        "Peso del metal (mg)": en.pesoMetalMg.toString(),
        Diseñador: en.disenador,
        "Lote de oro usado": oroRef.idLoteOro,
        "Oro consumido (mg)": oroRef.oroConsumidoMg.toString(),
        "Ley del oro (milésimas)": oroRef.leyOroMilesimas.toString(),
      },
      txHash: await buscarTxHash(contract, "EnsambladoRegistrado", id),
    });
  }

  // 5. Retail (Joyería)
  const rt = await contract.retails(id);
  if (rt.timestamp > 0n) {
    hitos.push({
      nombre: "5. Retail (Joyería)",
      registradoPor: rt.registradoPor,
      timestamp: Number(rt.timestamp),
      campos: {
        "ID tienda": rt.idTienda,
        "Precio (centavos)": rt.precioCentavos.toString(),
        "Estado de exhibición": rt.estadoExhibicion,
        "Código QR": rt.codigoQR,
      },
      txHash: await buscarTxHash(contract, "RetailRegistrado", id),
    });
  }

  // 6. Venta (Cliente final)
  const ve = await contract.ventas(id);
  if (ve.timestamp > 0n) {
    hitos.push({
      nombre: "6. Venta (Cliente final)",
      registradoPor: ve.registradoPor,
      timestamp: Number(ve.timestamp),
      campos: {
        Cliente: ve.idCliente,
        "Precio abonado (centavos)": ve.precioAbonadoCentavos.toString(),
        "Garantía activada": ve.garantiaActivada ? "Sí" : "No",
        "Wallet del cliente": ve.walletCliente,
      },
      txHash: await buscarTxHash(contract, "VentaRegistrada", id),
    });
  }

  return { tokenId, owner, etapa, hitos };
}
