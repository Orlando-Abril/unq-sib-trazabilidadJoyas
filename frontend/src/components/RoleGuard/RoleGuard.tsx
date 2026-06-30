import type { ReactNode } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useRole } from "../../hooks/useRole";
import type { RoleKey } from "../../config/roles";

export function RoleGuard({ role, children }: { role: RoleKey; children: ReactNode }) {
    const { isConnected, isCorrectNetwork } = useWallet();
    const { roles, loading } = useRole();

    if (!isConnected) return <p>Conectá tu wallet.</p>;
    if (!isCorrectNetwork) return <p>Cambiá a Sepolia.</p>;
    if (loading) return <p>Verificando permisos…</p>;
    if (!roles.includes(role)) return <p>🚫 No tenés permiso para esta sección.</p>;

    return <>{children}</>;
}