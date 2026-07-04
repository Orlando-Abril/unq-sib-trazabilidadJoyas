import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getHistoria } from "../services/historiaService";
import type { Historia } from "../services/historiaService";
import { ETAPA_LABEL } from "../types/trazabilidad";
import type { Etapa } from "../types/trazabilidad";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { SEPOLIA } from "../config/network";
import styles from "./VerificarPage.module.css";

export function VerificarPage() {
  const { tokenId } = useParams();
  if (!tokenId) return <Buscador />;
  return <Detalle tokenId={tokenId} />;
}

function Buscador() {
  const navigate = useNavigate();
  const [id, setId] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (id) navigate(`/verificar/${id}`);
  }

  return (
    <div className="card form-card">
      <h2 className="page-title">Verificar pieza</h2>
      <p className="page-subtitle">
        Ingresá el ID de la pieza (o escaneá su QR) para ver su historia completa.
      </p>
      <form onSubmit={handleSubmit}>
        <Input label="Token ID" type="number" min="1" value={id} onChange={(e) => setId(e.target.value)} required />
        <Button type="submit">Ver historia</Button>
      </form>
    </div>
  );
}

// Detalle: muestra la historia de una pieza.
function Detalle({ tokenId }: { tokenId: string }) {
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getHistoria(tokenId)
      .then(setHistoria)
      .catch((e) => setError(e?.message ?? "Error al leer la historia"))
      .finally(() => setLoading(false));
  }, [tokenId]);

  if (loading) return <p>Cargando historia de la pieza #{tokenId}…</p>;
  if (error) return <p className={styles.error}>❌ {error}</p>;
  if (!historia || !historia.owner) return <p>La pieza #{tokenId} no existe.</p>;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.href)}`;

  return (
    <div className={styles.container}>
      <header className={styles.head}>
        <div>
          <h2>Pieza #{historia.tokenId}</h2>
          <p className={styles.meta}>
            Etapa actual: <strong>{ETAPA_LABEL[historia.etapa as Etapa]}</strong>
          </p>
          <p className={styles.meta}>
            Dueño actual: <code>{historia.owner}</code>
          </p>
          <p className={styles.meta}>
            <a
              href={`${SEPOLIA.blockExplorer}/address/${historia.owner ?? ""}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver dueño en {SEPOLIA.name} Etherscan ↗
            </a>
          </p>
        </div>
        <img className={styles.qr} src={qrUrl} alt="QR de verificación" width={140} height={140} />
      </header>

      <ol className={styles.timeline}>
        {historia.hitos.map((h) => (
          <li key={h.nombre} className={styles.hito}>
            <h3>{h.nombre}</h3>
            <p className={styles.fecha}>{new Date(h.timestamp * 1000).toLocaleString()}</p>
            <dl className={styles.campos}>
              {Object.entries(h.campos).map(([k, v]) => (
                <div key={k} className={styles.campo}>
                  <dt>{k}</dt>
                  <dd>{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.firma}>
              Firmado por: <code>{h.registradoPor}</code>
            </p>
            {h.txHash && (
              <p className={styles.firma}>
                <a
                  href={`${SEPOLIA.blockExplorer}/tx/${h.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver transacción en {SEPOLIA.name} Etherscan ↗
                </a>
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
