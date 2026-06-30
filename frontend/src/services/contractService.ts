import { Contract } from "ethers";
import {
    JOYAS_ADDRESS,
    JOYAS_ABI,
    ORO_ADDRESS,
    ORO_ABI,
} from "../config/contract";
import { getProvider, getSigner } from "./provider";

// ===========================================================================
//  CONTRATO DE LA GEMA / PIEZA (ERC-721)
// ===========================================================================

// Para LEER datos (no requiere firmar, no gasta gas)
export function getReadContract(): Contract {
    const provider = getProvider();
    return new Contract(JOYAS_ADDRESS, [...JOYAS_ABI], provider);
}

// Para ESCRIBIR (firma con la wallet del usuario y gasta gas)
export async function getWriteContract(): Promise<Contract> {
    const signer = await getSigner();
    return new Contract(JOYAS_ADDRESS, [...JOYAS_ABI], signer);
}

// ===========================================================================
//  CONTRATO DEL ORO (ERC-20)
// ===========================================================================

export function getReadOro(): Contract {
    const provider = getProvider();
    return new Contract(ORO_ADDRESS, [...ORO_ABI], provider);
}

export async function getWriteOro(): Promise<Contract> {
    const signer = await getSigner();
    return new Contract(ORO_ADDRESS, [...ORO_ABI], signer);
}
