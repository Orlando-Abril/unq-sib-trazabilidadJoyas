// ===========================================================================
//  PINATA / IPFS
// ===========================================================================

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;

export async function subirArchivoAPinata(archivo: File): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error("Falta VITE_PINATA_JWT en el archivo .env");
    }

    const data = new FormData();
    data.append("file", archivo);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: data,
    });

    if (!res.ok) {
        throw new Error(`Pinata fallo (${res.status}): ${await res.text()}`);
    }

    const json = await res.json();
    return json.IpfsHash as string; // el CID
}

export function urlIPFS(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
