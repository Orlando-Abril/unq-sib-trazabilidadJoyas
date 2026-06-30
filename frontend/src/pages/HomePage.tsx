import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useRole } from "../hooks/useRole";
import { ROLES } from "../config/roles";

export function HomePage() {
  const { isConnected, isCorrectNetwork } = useWallet();
  const { roles, loading } = useRole();

  if (!isConnected)
    return (
      <div className="notice">
        <p>
          Conectá tu wallet de <strong>MetaMask</strong> para acceder a tu panel.
        </p>
      </div>
    );
  if (!isCorrectNetwork)
    return (
      <div className="notice">
        <p>
          Cambiá a la red <strong>Sepolia</strong> para continuar.
        </p>
      </div>
    );
  if (loading)
    return (
      <div className="notice">
        <p>Detectando tu rol on-chain…</p>
      </div>
    );
  if (roles.length === 0)
    return (
      <div className="notice">
        <p>
          Tu wallet no tiene ningún <strong>rol asignado</strong>. Pedile al administrador
          que te asigne uno.
        </p>
      </div>
    );

  return (
    <div>
      <div className="hero">
        <h2>Tus accesos</h2>
        <p>Elegí la etapa de la cadena que querés registrar.</p>
      </div>

      <div className="role-grid">
        {roles.map((r) => (
          <Link key={r} to={ROLES[r].path} className="role-card">
            <span className="role-icon">{ROLES[r].icon}</span>
            <span className="role-name">{ROLES[r].label}</span>
            <span className="role-cta">Ingresar →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
