import { Contract } from "ethers";
import {
    JOYAS_ADDRESS,
    JOYAS_ABI,
    ORO_ADDRESS,
    ORO_ABI,
} from "../config/contract";
import { getReadProvider, getSigner } from "./provider";

// ===========================================================================
//  CONTRATO DE LA GEMA / PIEZA (ERC-721)
// ===========================================================================

// LEER (publico, sin wallet) -> usa el RPC publico de Sepolia.
export function getReadContract(): Contract {
    return new Contract(JOYAS_ADDRESS, [...JOYAS_ABI], getReadProvider());
}

// ESCRIBIR (firma con la wallet del usuario y gasta gas)
export async function getWriteContract(): Promise<Contract> {
    const signer = await getSigner();
    return new Contract(JOYAS_ADDRESS, [...JOYAS_ABI], signer);
}

// ===========================================================================
//  CONTRATO DEL ORO (ERC-20)
// ===========================================================================

export function getReadOro(): Contract {
    return new Contract(ORO_ADDRESS, [...ORO_ABI], getReadProvider());
}

export async function getWriteOro(): Promise<Contract> {
    const signer = await getSigner();
    return new Contract(ORO_ADDRESS, [...ORO_ABI], signer);
}
