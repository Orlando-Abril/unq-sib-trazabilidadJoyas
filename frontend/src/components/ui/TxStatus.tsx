import styles from "./TxStatus.module.css";

export type TxState = "idle" | "pending" | "success" | "error";

interface Props {
  status: TxState;
  error?: string | null;
  successMessage?: string;
}

// Muestra el estado de una transacción: pendiente / éxito / error.
export function TxStatus({ status, error, successMessage }: Props) {
  if (status === "idle") return null;
  if (status === "pending")
    return <p className={styles.pending}>⏳ Enviando transacción… confirmá en MetaMask y esperá.</p>;
  if (status === "success")
    return <p className={styles.success}>✅ {successMessage ?? "Transacción confirmada."}</p>;
  return <p className={styles.error}>❌ {error}</p>;
}
