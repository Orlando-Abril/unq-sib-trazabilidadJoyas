import { BrowserProvider, JsonRpcSigner } from "ethers";

// MetaMask inyecta su API en window.ethereum
declare global {
    interface Window {
        ethereum?: any;
    }
}

// Provider = conexión de SOLO LECTURA a la blockchain
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