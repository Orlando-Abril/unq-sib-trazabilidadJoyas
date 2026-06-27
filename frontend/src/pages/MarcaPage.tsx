import type { FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

export function MarcaPage() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    sku: "",
    metalSoporte: "",
    pesoMetalMg: "",
    disenador: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarEnsamblado(
        BigInt(form.tokenId),
        form.sku,
        form.metalSoporte,
        BigInt(form.pesoMetalMg),
        form.disenador,
      );
      return tx.wait();
    });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Marca — Registrar ensamblado</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="SKU del producto final" value={form.sku} onChange={update("sku")} required />
        <Input label="Metal de soporte (ej. oro 18k)" value={form.metalSoporte} onChange={update("metalSoporte")} required />
        <Input label="Peso del metal (mg)" type="number" min="0" value={form.pesoMetalMg} onChange={update("pesoMetalMg")} required />
        <Input label="Diseñador" value={form.disenador} onChange={update("disenador")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar ensamblado"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Ensamblado registrado." />
    </div>
  );
}
