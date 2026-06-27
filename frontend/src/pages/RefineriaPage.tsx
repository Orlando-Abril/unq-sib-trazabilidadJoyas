import type { FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

export function RefineriaPage() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    idLoteEntrante: "",
    metodo: "",
    pesoPostMg: "",
    leyMilesimas: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarRefinado(
        BigInt(form.tokenId),
        form.idLoteEntrante,
        form.metodo,
        BigInt(form.pesoPostMg),
        Number(form.leyMilesimas),
      );
      return tx.wait();
    });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Refinería — Registrar refinado</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="ID del lote entrante" value={form.idLoteEntrante} onChange={update("idLoteEntrante")} required />
        <Input label="Método de refinado" value={form.metodo} onChange={update("metodo")} required />
        <Input label="Peso post-refinamiento (mg)" type="number" min="0" value={form.pesoPostMg} onChange={update("pesoPostMg")} required />
        <Input label="Ley / pureza (milésimas, ej. 750)" type="number" min="0" max="1000" value={form.leyMilesimas} onChange={update("leyMilesimas")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar refinado"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Refinado registrado." />
    </div>
  );
}
