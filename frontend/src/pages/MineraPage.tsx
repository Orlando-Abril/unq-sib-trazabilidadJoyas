import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

const ESTADO_INICIAL = {
  idLote: "",
  tipoMineralBruto: "",
  pesoNetoMg: "",
  responsable: "",
  estadoInicial: "",
};

export function MineraPage() {
  const { status, error, run } = useTransaction();
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [tokenId, setTokenId] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTokenId(null);

    const newTokenId = await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarExtraccion(
        form.idLote,
        form.tipoMineralBruto,
        BigInt(form.pesoNetoMg),
        form.responsable,
        form.estadoInicial,
      );
      const receipt = await tx.wait();

      // Buscamos el evento PiezaCreada para obtener el tokenId del NFT recién creado.
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed?.name === "PiezaCreada") {
            return parsed.args.tokenId.toString() as string;
          }
        } catch {
          // Log de otro contrato: lo ignoramos.
        }
      }
      return null;
    });

    if (newTokenId) setTokenId(newTokenId);
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Minera — Registrar extracción</h2>
      <form onSubmit={handleSubmit}>
        <Input label="ID del lote" value={form.idLote} onChange={update("idLote")} required />
        <Input
          label="Tipo de mineral bruto"
          value={form.tipoMineralBruto}
          onChange={update("tipoMineralBruto")}
          required
        />
        <Input
          label="Peso neto (mg)"
          type="number"
          min="0"
          value={form.pesoNetoMg}
          onChange={update("pesoNetoMg")}
          required
        />
        <Input
          label="Responsable"
          value={form.responsable}
          onChange={update("responsable")}
          required
        />
        <Input
          label="Estado inicial"
          value={form.estadoInicial}
          onChange={update("estadoInicial")}
          required
        />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar extracción"}
        </Button>
      </form>

      <TxStatus
        status={status}
        error={error}
        successMessage={tokenId ? `Pieza creada con tokenId ${tokenId} 🎉` : "Extracción registrada."}
      />
    </div>
  );
}
