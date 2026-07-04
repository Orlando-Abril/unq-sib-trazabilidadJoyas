
export const Etapa = {
    ExtraccionGema: 0,
    Tallado: 1,
    Certificacion: 2,
    Ensamblado: 3,
    Retail: 4,
    Venta: 5,
    Finalizada: 6,
} as const;

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
