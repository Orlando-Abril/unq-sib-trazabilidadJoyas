import { BrowserProvider, JsonRpcProvider, JsonRpcSigner } from "ethers";

declare global {
    interface Window {
        ethereum?: any;
    }
}


const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export function getReadProvider(): JsonRpcProvider {
    return new JsonRpcProvider(SEPOLIA_RPC);
}

export function getProvider(): BrowserProvider {
    if (!window.ethereum) {
        throw new Error("MetaMask no está instalado.");
    }
    return new BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<JsonRpcSigner> {
    const provider = getProvider();
    await provider.send("eth_requestAccounts", []);
    return provider.getSigner();
}
