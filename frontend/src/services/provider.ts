import { BrowserProvider, JsonRpcProvider, JsonRpcSigner } from "ethers";

// MetaMask inyecta su API en window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// RPC publico de Sepolia: permite LEER la blockchain sin wallet.
// Asi la verificacion por QR funciona en cualquier celular, sin MetaMask.
const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

// Lectura PUBLICA (no requiere MetaMask). Para la verificacion por QR.
export function getReadProvider(): JsonRpcProvider {
    return new JsonRpcProvider(SEPOLIA_RPC);
}

// Provider de la WALLET (requiere MetaMask) - para detectar cuenta y red.
export function getProvider(): BrowserProvider {
    if (!window.ethereum) {
        throw new Error("MetaMask no está instalado.");
    }
    return new BrowserProvider(window.ethereum);
}

// Signer = la wallet del usuario, necesaria para FIRMAR transacciones
export async function getSigner(): Promise<JsonRpcSigner> {
    const provider = getProvider();
    await provider.send("eth_requestAccounts", []); // pide conectar si hace falta
    return provider.getSigner();
}
