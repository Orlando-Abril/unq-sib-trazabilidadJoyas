import type { FormEvent } from "react";
import { getWriteContract, getWriteOro } from "../services/contractService";
import { JOYAS_ADDRESS } from "../config/contract";
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
    idLoteOro: "",
    oroConsumidoMg: "",
    leyOroMilesimas: "",
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const tokenId = BigInt(form.tokenId);
      const oroMg = BigInt(form.oroConsumidoMg);


      const oro = await getWriteOro();
      const txApprove = await oro.approve(JOYAS_ADDRESS, oroMg);
      await txApprove.wait();


      const joyas = await getWriteContract();
      const txEns = await joyas.registrarEnsamblado(tokenId, [
        form.sku,
        form.metalSoporte,
        BigInt(form.pesoMetalMg),
        form.disenador,
        form.idLoteOro,
        oroMg,
        Number(form.leyOroMilesimas),
      ]);
      return txEns.wait();
    });
  }

  return (
    <div className="card form-card">
      <h2 className="page-title">Marca — Registrar ensamblado</h2>
      <p className="page-subtitle">
        Convergencia · quema el oro consumido y arma la pieza final. Vas a firmar
        2 transacciones en MetaMask (autorizar el oro y registrar el ensamblado).
        Si no tenés suficiente oro real en la cadena, la segunda transacción
        va a revertir.
      </p>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID de la pieza" type="number" min="1" value={form.tokenId} onChange={update("tokenId")} required />
        <Input label="SKU del producto final" value={form.sku} onChange={update("sku")} required />
        <Input label="Metal de soporte (ej. oro 18k)" value={form.metalSoporte} onChange={update("metalSoporte")} required />
        <Input label="Peso del metal (mg)" type="number" min="0" value={form.pesoMetalMg} onChange={update("pesoMetalMg")} required />
        <Input label="Diseñador" value={form.disenador} onChange={update("disenador")} required />
        <Input label="ID del lote de oro usado" value={form.idLoteOro} onChange={update("idLoteOro")} required />
        <Input label="Oro consumido (mg) — se quema" type="number" min="1" value={form.oroConsumidoMg} onChange={update("oroConsumidoMg")} required />
        <Input label="Ley del oro (milésimas, ej. 750)" type="number" min="0" max="1000" value={form.leyOroMilesimas} onChange={update("leyOroMilesimas")} required />
        <Button type="submit" disabled={status === "pending"}>
          {status === "pending" ? "Procesando (2 firmas)…" : "Autorizar oro + registrar ensamblado"}
        </Button>
      </form>
      <TxStatus status={status} error={error} successMessage="Oro consumido y ensamblado registrado." />
    </div>
  );
}
