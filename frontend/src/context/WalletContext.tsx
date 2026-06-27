import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { getProvider } from "../services/provider";
import { SEPOLIA } from "../config/network";

interface WalletState {
    account: string | null;
    chainId: number | null;
    isConnected: boolean;
    isCorrectNetwork: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchToSepolia: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);

    async function connect() {
        const provider = getProvider();
        const accounts: string[] = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));
    }

    function disconnect() {
        setAccount(null);
    }

    async function switchToSepolia() {
        if (!window.ethereum) return;
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA.chainIdHex }],
        });
    }

    // Reaccionar a cambios de cuenta o de red en MetaMask
    useEffect(() => {
        if (!window.ethereum) return;
        const onAccounts = (accs: string[]) => setAccount(accs[0] ?? null);
        const onChain = (hex: string) => setChainId(parseInt(hex, 16));
        window.ethereum.on("accountsChanged", onAccounts);
        window.ethereum.on("chainChanged", onChain);
        return () => {
            window.ethereum.removeListener("accountsChanged", onAccounts);
            window.ethereum.removeListener("chainChanged", onChain);
        };
    }, []);

    const value: WalletState = {
        account,
        chainId,
        isConnected: account !== null,
        isCorrectNetwork: chainId === SEPOLIA.chainId,
        connect,
        disconnect,
        switchToSepolia,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWalletContext debe usarse dentro de WalletProvider");
    return ctx;
}