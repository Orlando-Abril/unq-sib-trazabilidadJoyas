import { Link } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useRole } from "../hooks/useRole";
import { ROLES } from "../config/roles";

export function HomePage() {
    const { isConnected, isCorrectNetwork } = useWallet();
    const { roles, loading } = useRole();

    if (!isConnected) return <p>Conectá tu wallet para continuar.</p>;
    if (!isCorrectNetwork) return <p>Cambiá a la red Sepolia.</p>;
    if (loading) return <p>Detectando tu rol…</p>;
    if (roles.length === 0) return <p>Tu wallet no tiene ningún rol asignado.</p>;

    return (
        <div>
            <h2>Tus accesos</h2>
            <ul>
                {roles.map((r) => (
                    <li key={r}>
                        <Link to={ROLES[r].path}>{ROLES[r].label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}