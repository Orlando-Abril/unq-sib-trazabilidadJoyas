import { useState } from "react";
import type { FormEvent } from "react";
import { getWriteContract } from "../services/contractService";
import { useTransaction } from "../hooks/useTransaction";
import { useForm } from "../hooks/useForm";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";

// La Joyería realiza dos hitos: Retail (6) y Venta (7).
export function JoyeriaPage() {
  return (
    <div className="stack">
      <RetailForm />
      <VentaForm />
    </div>
  );
}

function RetailForm() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    idTienda: "",
    precioCentavos: "",
    estadoExhibicion: "",
    codigoQR: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarRetail(
        BigInt(form.tokenId),
        form.idTienda,
        BigInt(form.precioCentavos),
        form.estadoExhibicion,
        form.codigoQR,
      );
      return tx.wait();
    });
  }

  return (
    <section className="card">
      <h2 className="page-title">Joyería — Retail (hito 6)</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="ID de la tienda" value={form.idTienda} onChange={update("idTienda")} required />
        <Input label="Precio (centavos)" type="number" min="0" value={form.precioCentavos} onChange={update("precioCentavos")} required />
        <Input label="Estado de exhibición" value={form.estadoExhibicion} onChange={update("estadoExhibicion")} required />
        <Input label="Código QR de verificación" value={form.codigoQR} onChange={update("codigoQR")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar retail"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Retail registrado." />
    </section>
  );
}

function VentaForm() {
  const { status, error, run } = useTransaction();
  const { form, update } = useForm({
    tokenId: "",
    idCliente: "",
    precioAbonadoCentavos: "",
    walletCliente: "",
  });
  const [garantia, setGarantia] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = await getWriteContract();
      const tx = await contract.registrarVenta(
        BigInt(form.tokenId),
        form.idCliente,
        BigInt(form.precioAbonadoCentavos),
        garantia,
        form.walletCliente,
      );
      return tx.wait();
    });
  }

  return (
    <section className="card">
      <h2 className="page-title">Joyería — Venta al cliente (hito 7)</h2>
      <p className="page-subtitle">
        Al registrar la venta, el NFT se transfiere a la wallet del cliente.
      </p>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="ID del cliente (mail)" value={form.idCliente} onChange={update("idCliente")} required />
        <Input label="Precio abonado (centavos)" type="number" min="0" value={form.precioAbonadoCentavos} onChange={update("precioAbonadoCentavos")} required />
        <Input label="Wallet del cliente (0x…)" value={form.walletCliente} onChange={update("walletCliente")} required />
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 1rem" }}>
          <input type="checkbox" checked={garantia} onChange={(e) => setGarantia(e.target.checked)} />
          Activar garantía
        </label>
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Registrando…" : "Registrar venta"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Venta registrada y NFT transferido al cliente." />
    </section>
  );
}
