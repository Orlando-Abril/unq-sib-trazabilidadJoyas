import { useEffect, useState } from "react";
import { getReadContract, getReadOro } from "../services/contractService";
import { ROLES } from "../config/roles";
import type { RoleKey } from "../config/roles";
import { useWallet } from "./useWallet";

export function useRole() {
    const { account, isCorrectNetwork } = useWallet();
    const [roles, setRoles] = useState<RoleKey[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchRoles() {
            if (!account || !isCorrectNetwork) {
                setRoles([]);
                return;
            }
            setLoading(true);
            try {
                // OJO: hay DOS contratos (Joyas y Oro), cada uno con su propia
                // AccessControl. Un rol como REFINERIA solo se otorga en el
                // contrato de Oro (Joyas ni siquiera declara esa constante), y
                // ADMIN puede estar otorgado en uno, el otro, o ambos. Por eso
                // se consulta hasRole() en LOS DOS contratos y alcanza con que
                // esté en cualquiera de los dos para mostrar la sección.
                const joyas = getReadContract();
                const oro = getReadOro();
                const keys = Object.keys(ROLES) as RoleKey[];
                const results = await Promise.all(
                    keys.map(async (k) => {
                        const [enJoyas, enOro] = await Promise.all([
                            joyas.hasRole(ROLES[k].hash, account).catch(() => false),
                            oro.hasRole(ROLES[k].hash, account).catch(() => false),
                        ]);
                        return Boolean(enJoyas) || Boolean(enOro);
                    }),
                );
                setRoles(keys.filter((_, i) => results[i]));
            } finally {
                setLoading(false);
            }
        }
        fetchRoles();
    }, [account, isCorrectNetwork]);

    return { roles, loading };
}