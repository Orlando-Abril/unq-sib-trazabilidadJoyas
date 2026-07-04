import type { FormEvent } from "react";
import { getWriteOro } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

export function RefineriaPage() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    idLote: "",
    metodo: "",
    pesoPostMg: "",
    leyMilesimas: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const oro = await getWriteOro();
      const tx = await oro.registrarRefinado(
        form.idLote,
        form.metodo,
        BigInt(form.pesoPostMg),
        Number(form.leyMilesimas),
      );
      return tx.wait();
    });
  }

  return (
    <div className="card form-card">
      <h2 className="page-title">Refinería — Registrar refinado</h2>
      <p className="page-subtitle">Rama del oro · fija método y ley del lote.</p>
      <form onSubmit={handleSubmit}>
        <Input label="ID del lote de oro" value={form.idLote} onChange={update("idLote")} required />
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
