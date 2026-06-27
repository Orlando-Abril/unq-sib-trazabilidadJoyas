import { Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import { getProvider, getSigner } from "./provider";

// Para LEER datos (no requiere firmar, no gasta gas)
export function getReadContract(): Contract {
    const provider = getProvider();
    return new Contract(CONTRACT_ADDRESS, [...CONTRACT_ABI], provider);
}

// Para ESCRIBIR (firma con la wallet del usuario y gasta gas)
export async function getWriteContract(): Promise<Contract> {
    const signer = await getSigner();
    return new Contract(CONTRACT_ADDRESS, [...CONTRACT_ABI], signer);
}