import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { subirArchivoAPinata, urlIPFS } from "../services/pinataService";
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

  // Estado de la subida del certificado a IPFS (Pinata).
  const [subiendo, setSubiendo] = useState(false);
  const [errorIPFS, setErrorIPFS] = useState<string | null>(null);

  async function handleArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setErrorIPFS(null);
    try {
      const cid = await subirArchivoAPinata(archivo);
      // Rellena el campo hashCertificadoIPFS con el CID que devolvio Pinata.
      update("hashCertificadoIPFS")({
        target: { value: cid },
      } as ChangeEvent<HTMLInputElement>);
    } catch (err) {
      setErrorIPFS((err as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

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
    <div className="card form-card">
      <h2 className="page-title">Certificadora (GIA) — Registrar certificación</h2>
      <p className="page-subtitle">Hito 4 · certificación de la gema.</p>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="Claridad (ej. VS1)" value={form.claridad} onChange={update("claridad")} required />
        <Input label="Color (ej. D)" value={form.color} onChange={update("color")} required />
        <Input label="Cut / corte (ej. Excelente)" value={form.cut} onChange={update("cut")} required />
        <Input label="Peso exacto (centiquilates)" type="number" min="0" value={form.pesoExactoCentiquilates} onChange={update("pesoExactoCentiquilates")} required />
        <Input label="N° de certificado (único)" value={form.numeroCertificado} onChange={update("numeroCertificado")} required />

        {/* Subida del certificado a IPFS (Pinata) */}
        <label style={{ display: "block", margin: "0 0 0.5rem", fontWeight: 600 }}>
          Certificado (PDF o imagen)
        </label>
        <input type="file" accept="application/pdf,image/*" onChange={handleArchivo} disabled={subiendo} />
        {subiendo && <p>Subiendo a IPFS…</p>}
        {errorIPFS && <p style={{ color: "crimson" }}>{errorIPFS}</p>}
        {form.hashCertificadoIPFS && (
          <p style={{ fontSize: "0.85rem" }}>
            Subido ✓ —{" "}
            <a href={urlIPFS(form.hashCertificadoIPFS)} target="_blank" rel="noreferrer">
              ver archivo
            </a>
          </p>
        )}

        <Input label="Hash IPFS del certificado" value={form.hashCertificadoIPFS} onChange={update("hashCertificadoIPFS")} required />
        <Button type="submit" disabled={status === "pending" || subiendo}>
          {status === "pending" ? "Registrando…" : "Registrar certificación"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Certificación registrada." />
    </div>
  );
}
