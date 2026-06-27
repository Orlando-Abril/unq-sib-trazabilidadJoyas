import { useEffect, useState } from "react";
import { getReadContract } from "../services/contractService";
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
                const contract = getReadContract();
                const keys = Object.keys(ROLES) as RoleKey[];
                const results = await Promise.all(
                    keys.map((k) => contract.hasRole(ROLES[k].hash, account)),
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