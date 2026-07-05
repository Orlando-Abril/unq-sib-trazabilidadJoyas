<div align="center">

# Sistema Descentralizado de Trazabilidad de Joyas Preciosas

Trazabilidad de la cadena de valor de minerales y gemas preciosas sobre Ethereum,
de la mina al cliente final, mediante NFTs inmutables y verificables.

</div>


## 📑 Tabla de contenidos

- [¿Qué es este proyecto?](#-qué-es-este-proyecto)
- [El problema y la solución](#-el-problema-y-la-solución)
- [Cómo funciona](#-cómo-funciona)
- [Los 7 roles de la cadena](#-los-7-roles-de-la-cadena)
- [Stack tecnológico](#-stack-tecnológico)
- [Smart Contract](#-smart-contract)
- [Decisiones de diseño](#-decisiones-de-diseño)
- [Autores](#-participantes)

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

## 📜 Smart Contract

- **Red:** Sepolia testnet
- **Dirección:** 0x8caE9a34d87acd181621C6288482D92BcDB043f3
- **Token Gema:** ERC-721 (No fungible)

- **Red:** Sepolia testnet
- **Dirección:** 0x44541f7F08B20Ea53f12f16e512B77F330c9C08e
- **Estandares:** ERC-20 (fungible)

Se desarrollan en [Remix](https://remix.ethereum.org/) y se despliegan en Sepolia mediante MetaMask.

## 🧠 Decisiones de diseño

- **Dos contratos, uno por cada naturaleza de activo (ERC-721 + ERC-20).** El oro es
  fungible —un miligramo de oro vale lo mismo que cualquier otro de la misma ley—,
  mientras que la gema es única y evoluciona hasta ser la pieza final. Se modelan con
  dos estándares distintos: [`TrazabilidadJoyas.sol`](contracts/TrazabilidadJoyas.sol)
  (ERC-721, la gema/pieza) y [`OroToken.sol`](contracts/OroToken.sol)
- **Bifurcación de ramas que convergen en el Ensamblado.** Rama del oro: Minera →
  Refinería (contrato `OroToken`). Rama de la gema: Minera → Tallado → Certificadora
  (contrato `TrazabilidadJoyas`). Las dos se unen cuando la Marca fabrica la pieza.
- **Patrón registry entre los dos contratos, actualizable por el admin.** En vez de
  hardcodear la dirección del contrato "hermano" al momento de compilar, cada uno
  guarda la dirección del otro en una variable de estado (`oroTokenContract` /
  `joyasContract`) que solo el admin puede actualizar (`setOroTokenContract` /
  `setJoyasContract`). Permite redeployar uno de los dos contratos sin tener que
  redeployar el otro.
- **Hitos append-only.** No existen funciones para editar ni borrar ningún hito ya
  registrado: la inmutabilidad es estructural —no depende de que nadie la respete—,
  no una convención de la interfaz.
- **Control de acceso por rol**, con `AccessControl` de OpenZeppelin en los DOS
  contratos por separado: cada función de registro exige el rol correspondiente
  (`MINERA_ROLE`, `REFINERIA_ROLE`, `TALLADO_ROLE`, `CERTIFICADORA_ROLE`,
  `MARCA_ROLE`, `JOYERIA_ROLE`). Como cada contrato tiene su propio `AccessControl`,
  un rol como Refinería solo existe en `OroToken` — ni siquiera está declarado en
  `TrazabilidadJoyas`.
- **Orden secuencial forzado** mediante una máquina de estados (`enum Etapa` +
  `etapaActual[tokenId]`, validada en cada función con `_requireEtapa`): no se puede
  saltear un hito ni registrar el mismo dos veces.
- **Documentos pesados en IPFS, solo el hash on-chain.** El certificado GIA (PDF) se
  sube a IPFS vía Pinata; en el contrato solo queda su hash (`hashCertificadoIPFS`),
  para minimizar el costo de gas.
- **Frontend en capas:** `config → services → hooks → components`. Ningún componente
  habla directo con ethers; todo pasa por la capa de servicios.

## 👩‍💻 Participantes

- Abril Orlando
- Guadalupe Zitterkopf
- Valentín Camaño
