// El hash de cada rol = keccak256(nombre). Son los mismos valores que usás
// en asignarRol y que el contrato compara internamente.
export const ROLES = {
  MINERA: {
    hash: "0x56827d4be2846122986c053b9505dd2904166b33762d1b3ef3bf178c6040b8cc",
    label: "Minera Cooperativa",
    path: "/minera",
    icon: "⛏️",
  },
  REFINERIA: {
    hash: "0x588b8f4afa91c9340332146429551e0d6de3e3e474ec0be40a7c748f43a97ffe",
    label: "Refinería",
    path: "/refineria",
    icon: "🔥",
  },
  TALLADO: {
    hash: "0x1b81515b8d451a1bd1a9e572d5ac809fe9eacce084c27398ae4d3472d404b50e",
    label: "Tallado",
    path: "/tallado",
    icon: "💠",
  },
  CERTIFICADORA: {
    hash: "0x7be5f6aa320f85547aaa0e947c7d4519a3973e1bfd6f022409ec64755845ebd7",
    label: "Certificadora (GIA)",
    path: "/certificadora",
    icon: "🔬",
  },
  MARCA: {
    hash: "0xeecba7db0811f0eec0bd134c9a8fa2e4b8c750be87cc8f1bcee9d82808e9fe69",
    label: "Marca / Fabricación",
    path: "/marca",
    icon: "💍",
  },
  JOYERIA: {
    hash: "0xbbe0006b9ae3e0a533e78b251c3ad4ed6e20e885e2745da84fb26e75d1ab0a20",
    label: "Joyería",
    path: "/joyeria",
    icon: "🏬",
  },
  // No es un rol de negocio: es el DEFAULT_ADMIN_ROLE que AccessControl le da
  // a quien deployó cada contrato (bytes32(0)). Se agrega acá para reusar
  // toda la infraestructura ya armada (useRole, RoleGuard, HomePage, rutas).
  ADMIN: {
    hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    label: "Administrador",
    path: "/admin",
    icon: "⚙️",
  },
} as const;

export type RoleKey = keyof typeof ROLES;
