import { useState } from "react";
import type { TxState } from "../components/ui/TxStatus";

// Encapsula el estado de una transacción (idle/pending/success/error) y
// traduce el error de ethers a un mensaje legible. Reutilizable en cada formulario.
export function useTransaction() {
  const [status, setStatus] = useState<TxState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function run<T>(action: () => Promise<T>): Promise<T | null> {
    setStatus("pending");
    setError(null);
    try {
      const result = await action();
      setStatus("success");
      return result;
    } catch (e: unknown) {
      const err = e as { reason?: string; shortMessage?: string; message?: string };
      setStatus("error");
      setError(err.reason || err.shortMessage || err.message || "Error desconocido");
      return null;
    }
  }

  return { status, error, run };
}
