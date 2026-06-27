// Espeja el enum Etapa del contrato (mismo orden).
// Usamos un objeto const en vez de `enum` porque la plantilla de Vite
// tiene activado erasableSyntaxOnly (no permite enums).
export const Etapa = {
    Extraccion: 0,
    Refinado: 1,
    Tallado: 2,
    Certificacion: 3,
    Ensamblado: 4,
    Retail: 5,
    Venta: 6,
    Finalizada: 7,
} as const;

// El tipo Etapa = 0 | 1 | 2 | ... | 7
export type Etapa = (typeof Etapa)[keyof typeof Etapa];

export const ETAPA_LABEL: Record<Etapa, string> = {
    0: "Extracción",
    1: "Refinado",
    2: "Tallado",
    3: "Certificación",
    4: "Ensamblado",
    5: "Retail",
    6: "Venta",
    7: "Finalizada",
};