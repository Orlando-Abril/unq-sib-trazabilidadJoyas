import { useState } from "react";
import type { FormEvent } from "react";
import { getWriteContract, getWriteOro } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { Accordion } from "../components/ui/Accordion";

// La minera abre las dos ramas. Cada accion se abre al hacer click en su seccion.
export function MineraPage() {
  return (
    <div className="stack">
      <Accordion title="Reportar lote gema" subtitle="Extrae la gema y crea un NFT para ella.">
        <GemaForm />
      </Accordion>
      <Accordion title="Reportar lote oro" subtitle="Extrae el oro y lo mintea como token.">
        <OroForm />
      </Accordion>
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
