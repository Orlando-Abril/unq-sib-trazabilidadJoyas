import { getReadContract } from "./contractService";

export interface Hito {
  nombre: string;
  registradoPor: string;
  timestamp: number;
  campos: Record<string, string>;
}

export interface Historia {
  tokenId: string;
  owner: string | null;
  etapa: number;
  hitos: Hito[];
}

// Lee la historia completa de una pieza (todos los hitos registrados).
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

  const ex = await contract.extracciones(id);
  if (ex.timestamp > 0n) {
    hitos.push({
      nombre: "1. Extracción (Minera)",
      registradoPor: ex.registradoPor,
      timestamp: Number(ex.timestamp),
      campos: {
        "ID lote": ex.idLote,
        "Mineral bruto": ex.tipoMineralBruto,
        "Peso neto (mg)": ex.pesoNetoMg.toString(),
        Responsable: ex.responsable,
        "Estado inicial": ex.estadoInicial,
      },
    });
  }

  const re = await contract.refinados(id);
  if (re.timestamp > 0n) {
    hitos.push({
      nombre: "2. Refinado (Refinería)",
      registradoPor: re.registradoPor,
      timestamp: Number(re.timestamp),
      campos: {
        "Lote entrante": re.idLoteEntrante,
        Método: re.metodo,
        "Peso post (mg)": re.pesoPostMg.toString(),
        "Ley (milésimas)": re.leyMilesimas.toString(),
      },
    });
  }

  const ta = await contract.tallados(id);
  if (ta.timestamp > 0n) {
    hitos.push({
      nombre: "3. Tallado",
      registradoPor: ta.registradoPor,
      timestamp: Number(ta.timestamp),
      campos: {
        "Lote refinado": ta.idLoteRefinado,
        "Tipo de corte": ta.tipoCorte,
        "Peso (centiquilates)": ta.pesoCentiquilates.toString(),
        "Cantidad de piezas": ta.cantidadPiezas.toString(),
      },
    });
  }

  const ce = await contract.certificaciones(id);
  if (ce.timestamp > 0n) {
    hitos.push({
      nombre: "4. Certificación (GIA)",
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
    });
  }

  const en = await contract.ensamblados(id);
  if (en.timestamp > 0n) {
    hitos.push({
      nombre: "5. Ensamblado (Marca)",
      registradoPor: en.registradoPor,
      timestamp: Number(en.timestamp),
      campos: {
        SKU: en.sku,
        "Metal de soporte": en.metalSoporte,
        "Peso del metal (mg)": en.pesoMetalMg.toString(),
        Diseñador: en.disenador,
      },
    });
  }

  const rt = await contract.retails(id);
  if (rt.timestamp > 0n) {
    hitos.push({
      nombre: "6. Retail (Joyería)",
      registradoPor: rt.registradoPor,
      timestamp: Number(rt.timestamp),
      campos: {
        "ID tienda": rt.idTienda,
        "Precio (centavos)": rt.precioCentavos.toString(),
        "Estado de exhibición": rt.estadoExhibicion,
        "Código QR": rt.codigoQR,
      },
    });
  }

  const ve = await contract.ventas(id);
  if (ve.timestamp > 0n) {
    hitos.push({
      nombre: "7. Venta (Cliente final)",
      registradoPor: ve.registradoPor,
      timestamp: Number(ve.timestamp),
      campos: {
        Cliente: ve.idCliente,
        "Precio abonado (centavos)": ve.precioAbonadoCentavos.toString(),
        "Garantía activada": ve.garantiaActivada ? "Sí" : "No",
        "Wallet del cliente": ve.walletCliente,
      },
    });
  }

  return { tokenId, owner, etapa, hitos };
}
