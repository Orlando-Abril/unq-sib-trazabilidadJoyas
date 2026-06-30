// ===========================================================================
//  PINATA / IPFS
//  Sube el archivo del certificado a IPFS via Pinata y devuelve su CID (hash).
//  La API key (JWT) se lee de la variable de entorno VITE_PINATA_JWT (.env).
// ===========================================================================

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;

// Sube un archivo a IPFS y devuelve su CID (el hash "Qm...").
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

// Arma el link publico para ver el archivo subido.
export function urlIPFS(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
