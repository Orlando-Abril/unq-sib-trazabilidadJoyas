import { useCallback, useEffect, useRef, useState } from "react";
import { getReadContract, getReadOro } from "../services/contractService";
import { ROLES } from "../config/roles";
import type { RoleKey } from "../config/roles";
import { useWallet } from "./useWallet";

const POLL_MS = 8000;

export function useRole() {
    const { account, isCorrectNetwork } = useWallet();
    const [roles, setRoles] = useState<RoleKey[]>([]);
    const [loading, setLoading] = useState(false);

    const primerFetch = useRef(true);

    const fetchRoles = useCallback(async () => {
        if (!account || !isCorrectNetwork) {
            setRoles([]);
            primerFetch.current = true;
            return;
        }
        if (primerFetch.current) setLoading(true);
        try {
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
            primerFetch.current = false;
        }
    }, [account, isCorrectNetwork]);

    useEffect(() => {
        fetchRoles();
        if (!account || !isCorrectNetwork) return;
        const id = setInterval(fetchRoles, POLL_MS);
        return () => clearInterval(id);
    }, [account, isCorrectNetwork, fetchRoles]);

    return { roles, loading, refetch: fetchRoles };
}