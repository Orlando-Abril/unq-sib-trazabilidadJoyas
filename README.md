<div align="center">

# 💎 Sistema Descentralizado de Trazabilidad de Joyas Preciosas

Trazabilidad de la cadena de valor de minerales y gemas preciosas sobre Ethereum,
de la mina al cliente final, mediante NFTs inmutables y verificables.

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![ethers.js](https://img.shields.io/badge/ethers.js-6-2535A0)
![Network](https://img.shields.io/badge/Network-Sepolia-purple)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 📑 Tabla de contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [El problema y la solución](#-el-problema-y-la-solución)
- [Cómo funciona](#-cómo-funciona)
- [Los 7 roles de la cadena](#-los-7-roles-de-la-cadena)
- [Arquitectura del repositorio](#-arquitectura-del-repositorio)
- [Stack tecnológico](#-stack-tecnológico)
- [Smart Contract](#-smart-contract)
- [Puesta en marcha](#-puesta-en-marcha)
- [Decisiones de diseño](#-decisiones-de-diseño)
- [Roadmap](#-roadmap)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## 📌 ¿Qué es este proyecto?

Un sistema que reemplaza los registros en papel —falsificables y dependientes de la
confianza en cada intermediario— por **formularios inmutables en blockchain**.

Cada joya se representa como un **NFT (token único ERC-721)** que acumula su historia
en **7 hitos**, desde la extracción del mineral hasta el cliente final. Cada actor de
la cadena (minera, refinería, tallador, certificadora, marca, joyería) firma su paso
con su propia wallet, y cualquiera puede verificar la procedencia y autenticidad de
la pieza **sin intermediarios**, simplemente escaneando un código QR.

> Trabajo Final · Seminario de Blockchain 2026 (1er semestre)

## 🎯 El problema y la solución

| Hoy (papel / sistemas centralizados) | Con esta solución (blockchain) |
|--------------------------------------|--------------------------------|
| Registros falsificables | Hitos inmutables: no se pueden editar ni borrar |
| Hay que confiar en cada intermediario | La autoría queda firmada criptográficamente |
| Información opaca y fragmentada | Historia completa, pública y verificable |
| Difícil probar el origen | Trazabilidad de la mina al cliente |

**Por qué blockchain:**

- **Inmutabilidad** — una vez desplegado, el contrato y los hitos no pueden modificarse, ni siquiera por su creador.
- **Transparencia** — la lógica corre on-chain, sin servidor central; cualquiera puede leer la historia de la pieza.
- **Autoría verificable** — cada hito queda firmado por la cuenta del actor que lo registró.

## ⚙️ Cómo funciona

```
        ┌─ rama del ORO ─────────────┐
Minera ─┤                            ├─→ Marca → Joyería → Cliente
        └─ rama de la GEMA ──────────┘   (ensamblado)  (retail)   (venta)
          Tallado → Certificadora
```

Cada actor conecta su wallet de MetaMask y el sistema lo enruta al formulario que le
corresponde según el **rol** asignado a su dirección, sobre la testnet **Sepolia**.
Los datos clave se guardan **on-chain** y los documentos pesados (certificados, fotos)
en **IPFS**, almacenando solo su hash para minimizar el costo de gas.

La pieza llega al cliente con su historia completa, firmada e inmutable, verificable
por cualquiera mediante un **código QR**.

## 👥 Los 7 roles de la cadena

| # | Rol | Hito | Campos clave |
|---|-----|------|--------------|
| 1 | **Minera Cooperativa** | Extracción (mintea el NFT) | ID lote, mineral bruto, peso neto, responsable |
| 2 | **Refinería** | Refinado del oro | Método, peso post-refinamiento, % de pureza (ley) |
| 3 | **Tallado** | Corte de la gema | Tipo de talla, quilates, cantidad de piezas |
| 4 | **Certificadora (GIA)** | Certificación | Claridad, color, cut, N° de certificado |
| 5 | **Marca / Fabricación** | Ensamblado | SKU, metal de soporte, diseñador |
| 6 | **Joyería** | Retail | Precio, estado de exhibición, código QR |
| 7 | **Cliente Final** | Venta y propiedad | Compra, garantía, transferencia del NFT |

> Los hitos se registran **en orden** y **una sola vez**: el contrato rechaza cualquier
> intento de saltear pasos o de modificar lo ya escrito.

## 🗂 Arquitectura del repositorio

Monorepo con el contrato y el frontend separados por capas.

```
unq-sib-trazabilidadJoyas/
├── contracts/                  # Smart contract en Solidity
│   └── TrazabilidadJoyas.sol
├── frontend/                   # DApp en React + TypeScript (Vite)
│   └── src/
│       ├── components/         # Componentes de UI reutilizables
│       ├── pages/              # Una vista por DApp/rol + verificación pública
│       ├── hooks/              # useWallet, useRole, useForm, useTransaction
│       ├── context/            # Estado global de la wallet
│       ├── services/           # Capa de acceso a la blockchain (ethers)
│       ├── config/             # Red, dirección del contrato, ABI y roles
│       └── types/              # Tipos compartidos
├── docs/                       # Guía de prueba y documentación
└── README.md
```

## 🛠 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Smart contract | Solidity 0.8.20, OpenZeppelin (ERC-721 + AccessControl) |
| Red | Ethereum Sepolia (testnet) |
| Frontend | React 19 + TypeScript + Vite |
| Conexión blockchain | ethers.js v6 |
| Estilos | CSS Modules |
| Wallet | MetaMask |
| Almacenamiento pesado | IPFS (hash on-chain) |

## 📜 Smart Contract

- **Red:** Sepolia testnet
- **Dirección:** [`0x25d24eB8577e93E0Aa6557791fB6841520214107`](https://sepolia.etherscan.io/address/0x25d24eB8577e93E0Aa6557791fB6841520214107)
- **Token:** Trazabilidad Joyas (`TJOYA`) — ERC-721
- **Estándares:** ERC-721 + AccessControl (OpenZeppelin)
- **Verificado en:** Sourcify · Blockscout

El paso a paso para probar el contrato hito por hito está en
[`docs/GUIA_PRUEBA.md`](docs/GUIA_PRUEBA.md).

## 🚀 Puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) 18+
- [MetaMask](https://metamask.io/) con la red Sepolia y algo de SepoliaETH (de un faucet)

### Smart contract

Se desarrolla en [Remix](https://remix.ethereum.org/) y se despliega en Sepolia
mediante *Injected Provider - MetaMask*. El código está en
[`contracts/TrazabilidadJoyas.sol`](contracts/TrazabilidadJoyas.sol).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## 🧠 Decisiones de diseño

- **Un contrato ERC-721, no ERC-721 + ERC-20 juntos.** Un mismo contrato no puede
  heredar ambos estándares (colisión de `balanceOf`). El oro fungible se documenta
  como datos on-chain (peso + ley) dentro del hito de Refinería. Un token de oro
  ERC-20 transferible, de necesitarse, iría en un contrato aparte.
- **Hitos append-only.** No existen funciones para editar ni borrar: la inmutabilidad
  es estructural, no una convención.
- **Control de acceso por rol** con `AccessControl` de OpenZeppelin: cada función de
  registro exige el rol correspondiente (`MINERA_ROLE`, `REFINERIA_ROLE`, …).
- **Orden secuencial forzado** mediante una máquina de estados (`etapaActual`).
- **Frontend en capas:** `config → services → hooks → components`. Ningún componente
  habla directo con ethers; todo pasa por la capa de servicios.
- **Documentos pesados en IPFS**, solo el hash on-chain, para minimizar gas.

## 🗺 Roadmap

- [x] Smart contract con los 7 hitos, roles e inmutabilidad
- [x] Despliegue y verificación en Sepolia
- [x] Frontend: conexión de wallet y detección de rol
- [x] Frontend: los 7 formularios por rol
- [x] Página pública de verificación (QR)
- [ ] Integración con IPFS para certificados y fotos
- [ ] Panel de administración para asignar roles desde la UI

## 👩‍💻 Autores

- Abril Orlando
- Guadalupe Zitterkopf
- Valentín Camaño

## 📄 Licencia

Distribuido bajo licencia MIT. Ver el archivo `LICENSE` para más detalles.
