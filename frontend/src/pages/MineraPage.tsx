import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getReadContract, getReadOro, getWriteContract, getWriteOro } from "../services/contractService";
import { ROLES } from "../config/roles";
import { useWallet } from "../hooks/useWallet";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { Accordion } from "../components/ui/Accordion";

// MINERA_ROLE se puede otorgar en el contrato de Joyas (rama de la gema), en
// el de Oro (rama del oro), o en los dos — son AccessControl independientes.
// Antes esta página mostraba SIEMPRE los dos formularios sin importar en cuál
// de los dos contratos tenías el rol realmente (con el riesgo de que alguien
// complete el que no le corresponde y la transacción revierta). Ahora se
// chequea hasRole() por separado en cada contrato y solo se muestra el
// formulario que esa wallet puede usar de verdad.
export function MineraPage() {
  const { account } = useWallet();
  const [puedeGema, setPuedeGema] = useState(false);
  const [puedeOro, setPuedeOro] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (!account) {
        setPuedeGema(false);
        setPuedeOro(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const [enJoyas, enOro] = await Promise.all([
          getReadContract().hasRole(ROLES.MINERA.hash, account).catch(() => false),
          getReadOro().hasRole(ROLES.MINERA.hash, account).catch(() => false),
        ]);
        setPuedeGema(Boolean(enJoyas));
        setPuedeOro(Boolean(enOro));
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [account]);

  if (checking) return <p>Verificando en qué rama tenés el rol de Minera…</p>;

  if (!puedeGema && !puedeOro) {
    return (
      <div className="notice">
        <p>
          🚫 Tu wallet tiene el rol de Minera, pero no está habilitada en ninguno de los dos
          contratos ahora mismo.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      {puedeGema && (
        <Accordion title="Reportar lote gema" subtitle="Extrae la gema y crea un NFT para ella.">
          <GemaForm />
        </Accordion>
      )}
      {puedeOro && (
        <Accordion title="Reportar lote oro" subtitle="Extrae el oro y lo mintea como token.">
          <OroForm />
        </Accordion>
      )}
    </div>
  );
}

function GemaForm() {
  const { status, error, run } = useTransaction();
  const [tokenId, setTokenId] = useState<string | null>(null);
  const { form, update } = useForm({
    idLote: "",
    tipoGemaBruta: "",
    pesoBrutoCentiquilates: "",
    responsable: "",
    estadoInicial: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTokenId(null);
    const nuevo = await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarExtraccionGema(
        form.idLote,
        form.tipoGemaBruta,
        BigInt(form.pesoBrutoCentiquilates),
        form.responsable,
        form.estadoInicial,
      );
      const receipt = await tx.wait();
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "GemaCreada") {
            return parsed.args.tokenId.toString() as string;
          }
        } catch {
          // Log de otro contrato: lo ignoramos.
        }
      }
      return null;
    });
    if (nuevo) setTokenId(nuevo);
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Input label="ID del lote" value={form.idLote} onChange={update("idLote")} required />
        <Input label="Tipo de gema en bruto" value={form.tipoGemaBruta} onChange={update("tipoGemaBruta")} required />
        <Input label="Peso bruto (centiquilates, ej. 200 = 2.00 ct)" type="number" min="0" value={form.pesoBrutoCentiquilates} onChange={update("pesoBrutoCentiquilates")} required />
        <Input label="Responsable" value={form.responsable} onChange={update("responsable")} required />
        <Input label="Estado inicial" value={form.estadoInicial} onChange={update("estadoInicial")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando..." : "Crear NFT de gema"}
        </Button>
      </form>
      <TxStatus
        status={status}
        error={error}
        successMessage={tokenId ? "Gema creada con tokenId " + tokenId : "Extraccion de gema registrada."}
      />
    </>
  );
}

function OroForm() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    idLote: "",
    tipoMineralBruto: "",
    pesoBrutoMg: "",
    responsable: "",
    estadoInicial: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteOro();
      const tx = await contract.registrarExtraccionOro(
        form.idLote,
        form.tipoMineralBruto,
        BigInt(form.pesoBrutoMg),
        form.responsable,
        form.estadoInicial,
      );
      return tx.wait();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Input label="ID del lote de oro" value={form.idLote} onChange={update("idLote")} required />
        <Input label="Tipo de mineral bruto" value={form.tipoMineralBruto} onChange={update("tipoMineralBruto")} required />
        <Input label="Peso bruto (mg, ej. 50000 = 50 g)" type="number" min="1" value={form.pesoBrutoMg} onChange={update("pesoBrutoMg")} required />
        <Input label="Responsable" value={form.responsable} onChange={update("responsable")} required />
        <Input label="Estado inicial" value={form.estadoInicial} onChange={update("estadoInicial")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando..." : "Mintear oro"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Oro extraido y minteado." />
    </>
  );
}
