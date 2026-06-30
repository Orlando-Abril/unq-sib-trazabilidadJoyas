import type { FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

export function TalladoPage() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    idLoteGema: "",
    tipoCorte: "",
    pesoCentiquilates: "",
    cantidadPiezas: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarTallado(
        BigInt(form.tokenId),
        form.idLoteGema,
        form.tipoCorte,
        BigInt(form.pesoCentiquilates),
        Number(form.cantidadPiezas),
      );
      return tx.wait();
    });
  }

  return (
    <div className="card form-card">
      <h2 className="page-title">Tallado — Registrar corte de gema</h2>
      <p className="page-subtitle">Hito 3 · corte de la gema.</p>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="ID del lote de gema" value={form.idLoteGema} onChange={update("idLoteGema")} required />
        <Input label="Tipo de corte / talla" value={form.tipoCorte} onChange={update("tipoCorte")} required />
        <Input label="Peso (centiquilates, ej. 150 = 1.50 ct)" type="number" min="0" value={form.pesoCentiquilates} onChange={update("pesoCentiquilates")} required />
        <Input label="Cantidad de piezas" type="number" min="1" value={form.cantidadPiezas} onChange={update("cantidadPiezas")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar tallado"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Tallado registrado." />
    </div>
  );
}
