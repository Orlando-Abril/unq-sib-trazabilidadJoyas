import type { FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

export function CertificadoraPage() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    claridad: "",
    color: "",
    cut: "",
    pesoExactoCentiquilates: "",
    numeroCertificado: "",
    hashCertificadoIPFS: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      // El 2º argumento es el struct DatosCertificacion (se pasa como tupla/array en orden).
      const tx = await contract.registrarCertificacion(BigInt(form.tokenId), [
        form.claridad,
        form.color,
        form.cut,
        BigInt(form.pesoExactoCentiquilates),
        form.numeroCertificado,
        form.hashCertificadoIPFS,
      ]);
      return tx.wait();
    });
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Certificadora (GIA) — Registrar certificación</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="Claridad (ej. VS1)" value={form.claridad} onChange={update("claridad")} required />
        <Input label="Color (ej. D)" value={form.color} onChange={update("color")} required />
        <Input label="Cut / corte (ej. Excelente)" value={form.cut} onChange={update("cut")} required />
        <Input label="Peso exacto (centiquilates)" type="number" min="0" value={form.pesoExactoCentiquilates} onChange={update("pesoExactoCentiquilates")} required />
        <Input label="N° de certificado (único)" value={form.numeroCertificado} onChange={update("numeroCertificado")} required />
        <Input label="Hash IPFS del certificado" value={form.hashCertificadoIPFS} onChange={update("hashCertificadoIPFS")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar certificación"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Certificación registrada." />
    </div>
  );
}
