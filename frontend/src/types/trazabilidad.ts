// Espeja el enum Etapa del contrato TrazabilidadJoyas (mismo orden).
// El refinado del oro YA NO es una etapa del NFT: vive en el contrato OroToken.
// Usamos un objeto const en vez de `enum` porque la plantilla de Vite
// tiene activado erasableSyntaxOnly (no permite enums).
export const Etapa = {
    ExtraccionGema: 0,
    Tallado: 1,
    Certificacion: 2,
    Ensamblado: 3,
    Retail: 4,
    Venta: 5,
    Finalizada: 6,
} as const;

// El tipo Etapa = 0 | 1 | 2 | ... | 6
export type Etapa = (typeof Etapa)[keyof typeof Etapa];

export const ETAPA_LABEL: Record<Etapa, string> = {
    0: "Extracción de gema",
    1: "Tallado",
    2: "Certificación",
    3: "Ensamblado",
    4: "Retail",
    5: "Venta",
    6: "Finalizada",
};
