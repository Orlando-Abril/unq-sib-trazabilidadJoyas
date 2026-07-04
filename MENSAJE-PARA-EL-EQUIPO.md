# Cambios en `feature/caratula` — correcciones del profe

Ya está todo aplicado en la rama `feature/caratula` (probado local). Guía de qué cambió, dónde, y qué hay que hacer para que quede andando en Sepolia. Antes de tocar nada: `git pull` de esta rama para tener todo.

---

## 1. Panel de Admin (asignar roles sin Remix)

**Nuevo archivo:** `frontend/src/pages/AdminPage.tsx`

Página en `/admin` que aparece sola en el Home (como una tarjeta más) para quien tenga el rol admin (`DEFAULT_ADMIN_ROLE`) en el contrato de Joyas y/o el de Oro. Tiene 2 secciones:

- **Asignar rol**: elegís contrato (Joyas / Oro), rol, pegás la wallet, y llama a `asignarRol(hash, cuenta)`.
- **Configurar contratos (registry)**: ver punto 2.

**Otros archivos tocados para que esto funcione:**
- `frontend/src/config/roles.ts`: se agregó `ADMIN` a `ROLES` (hash = `0x00...00`, el `DEFAULT_ADMIN_ROLE` de AccessControl). Así se reusa toda la infraestructura que ya existía (rutas, `RoleGuard`, tarjetas del Home).
- `frontend/src/App.tsx`: se importó `AdminPage` y se agregó `ADMIN: <AdminPage />` al mapa `PAGES`.
- `frontend/src/config/contract.ts`: se agregó `export const DEFAULT_ADMIN_ROLE = "0x00...00"`.
- `frontend/src/hooks/useRole.ts`: **bug que encontramos de paso** — antes este hook solo consultaba `hasRole` contra el contrato de Joyas para TODOS los roles, incluido Refinería. Pero Refinería solo existe de verdad en el contrato de Oro. Resultado: aunque el admin le asignara el rol a alguien en Oro, la web nunca le mostraba la tarjeta de Refinería en el Home. Ahora se consulta en los dos contratos y alcanza con que esté en cualquiera de los dos.

---

## 2. Registro de direcciones (lo del "factory" que pidió el profe)

En vez de que los dos contratos queden atados para siempre por dirección fija, cada uno ahora **guarda la dirección del otro en una variable que el admin puede actualizar**, sin redeployar nada:

- `contracts/TrazabilidadJoyas.sol`: nueva variable `oroTokenContract` + función `setOroTokenContract(address)` (solo admin).
- `contracts/OroToken.sol`: nueva variable `joyasContract` + función `setJoyasContract(address)` (solo admin).

Esto es justo lo que arma el panel de Admin en "Configurar contratos". **Se hace una sola vez, después de cada deploy nuevo de cualquiera de los dos contratos.**

---

## 3. La restricción real del oro (la pregunta que nos hizo el profe)

Antes: la Marca quemaba oro en un contrato (`OroToken`) y por separado cargaba un número a mano en el otro (`TrazabilidadJoyas.registrarEnsamblado`). Nada garantizaba que los dos números coincidieran — se podía cargar una pieza de 55.000mg de oro aunque en la cadena solo hubiera 48.000mg reales.

**Ahora es atómico:**

1. La Marca hace `oro.approve(direccionDeJoyas, cantidadMg)` en `OroToken` (estándar ERC-20, como un DEX).
2. Llama a `registrarEnsamblado(...)` en `TrazabilidadJoyas`. **En la misma transacción**, ese contrato llama a `oro.burnFrom(marca, tokenId, cantidadMg)`, que quema el oro real. Si la Marca no tiene esa cantidad, la transacción entera revierte y la pieza NO se crea.

**Archivos:**
- `contracts/OroToken.sol`: nueva función `burnFrom(address cuenta, uint256 tokenIdPieza, uint256 cantidadMg)`, solo puede llamarla el contrato de Joyas registrado (`joyasContract`).
- `contracts/TrazabilidadJoyas.sol`: `registrarEnsamblado` ahora llama a `IOroToken(oroTokenContract).burnFrom(...)` antes de guardar los datos.
- `frontend/src/pages/MarcaPage.tsx`: ahora hace 2 transacciones (`approve` + `registrarEnsamblado`) en vez de 2 llamadas sueltas sin relación.
- `frontend/src/config/contract.ts`: se sacó `consumirOroParaPieza` del ABI (ya no existe) y se agregaron `approve`, `allowance`, `burnFrom`, `joyasContract`, `setJoyasContract`, `oroTokenContract`, `setOroTokenContract`.

**Ojo con esto:** de paso encontramos que los dos archivos `.sol` en el repo estaban **incompletos** (cortados a mitad de una función, probablemente un copy-paste desde Remix que no se guardó entero). Les faltaba `getOroDeEnsamblado`, los helpers internos y hasta la llave de cierre del contrato. Ya está completado — pero **comparen contra lo que tienen deployado en Remix ahora mismo**, por si el contrato real en Sepolia tiene algo que el archivo del repo no tenía.

### ⚠️ Esto obliga a un redeploy de LOS DOS contratos

Como se agregaron variables y funciones nuevas, hay que redeployar `OroToken.sol` y `TrazabilidadJoyas.sol` de nuevo en Remix. Eso implica:

1. Deployar `OroToken.sol` → copiar la nueva dirección.
2. Deployar `TrazabilidadJoyas.sol` → copiar la nueva dirección.
3. Pegar ambas direcciones en `frontend/src/config/contract.ts` (`JOYAS_ADDRESS` y `ORO_ADDRESS`).
4. Entrar a `/admin` con la wallet que deployó, y en "Configurar contratos" guardar cada dirección cruzada (punto 2).
5. **Reasignar TODOS los roles de los 3** en `/admin` (antes se hacía en Remix, ahora ya no hace falta, pero como son contratos nuevos, los roles viejos no existen más ahí).
6. Vamos a perder las piezas ya registradas en la demo vieja (quedan en la dirección anterior, que se puede seguir consultando en Etherscan pero no en la web una vez que cambiemos `JOYAS_ADDRESS`). Conviene hacer este redeploy con tiempo antes del martes y volver a cargar 1-2 piezas de prueba para probar el flujo completo.

**Sugerencia:** prueben primero este flujo completo en la VM de Remix (o en una red de test aparte) antes de tocar la Sepolia "de verdad", así no gastamos ETH de test en reintentos.

---

## 4. Link al block explorer en la verificación pública

`frontend/src/services/historiaService.ts`: cada hito ahora busca su `txHash` real (vía `queryFilter` del evento correspondiente, ej. `GemaCreada`, `TalladoRegistrado`, etc.) y lo agrega al objeto.

`frontend/src/pages/VerificarPage.tsx`: cada hito de la timeline muestra un link "Ver transacción en Sepolia Etherscan ↗", y arriba también un link a la wallet del dueño actual.

No requiere ningún cambio de contrato, ya funciona con lo que hay deployado.

---

## 5. UX de Joyería: opciones al frente

`frontend/src/pages/JoyeriaPage.tsx`: se sacó el acordeón (había que hacer click para desplegar cada opción). Ahora aparecen 2 tarjetas grandes de entrada — "Poner en venta" y "Vender a un cliente" — y clickeando una se muestra directamente su formulario abajo.

---

## 6. Justificación de los datos on-chain (por si el profe pregunta de nuevo)

Argumento para el martes:

- Ya seguimos la buena práctica en el punto más pesado: el certificado GIA es un PDF, y NO lo subimos on-chain — solo guardamos `hashCertificadoIPFS` (el documento vive en IPFS). Eso es exactamente el patrón "hash on-chain, blob off-chain" que se espera.
- Lo que sí queda on-chain por hito son campos cortos y acotados: IDs, un par de strings cortos, números, direcciones y timestamps. No hay listas, no hay texto libre largo, no hay archivos. Cada hito se escribe UNA sola vez (append-only), así que el costo de gas es predecible y se paga una sola vez por etapa — no es un storage que crece sin control.
- El propósito del proyecto es justamente que ese registro esté on-chain: es lo que le da valor a la verificación pública por QR (si estuviera en una base de datos común, cualquiera podría alterarlo).
- Si igual quieren recortar más para un caso real a mayor escala: los campos que son puramente identificadores (`idLote`, `idTienda`, `numeroCertificado`, `codigoQR`) podrían pasar de `string` a `bytes32` (más barato en gas si entran en 32 bytes, que en la gran mayoría de los códigos de lote pasa). Es una optimización de gas, no arquitectural, y la dejamos como "próximo paso" a mencionar si preguntan cómo escalarían esto.

---

## Resumen de archivos tocados

**Contratos** (necesitan redeploy):
- `contracts/OroToken.sol`
- `contracts/TrazabilidadJoyas.sol`

**Frontend** (con `git pull` alcanza, no necesitan redeploy salvo por las direcciones nuevas):
- `frontend/src/config/contract.ts`
- `frontend/src/config/roles.ts`
- `frontend/src/hooks/useRole.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/AdminPage.tsx` (nuevo)
- `frontend/src/pages/MarcaPage.tsx`
- `frontend/src/pages/JoyeriaPage.tsx`
- `frontend/src/pages/VerificarPage.tsx`
- `frontend/src/services/historiaService.ts`

## Antes del martes

1. Alguien corre `npm run build` en `frontend/` para chequear que compila sin errores de TypeScript (no lo pude correr yo desde acá).
2. Redeploy de los 2 contratos en Remix + pasos de la sección 3.
3. Reasignar roles de los 3 desde `/admin`.
4. Cargar 1-2 piezas de prueba completas (las 6 etapas) para asegurarse de que el flujo de principio a fin funciona con los contratos nuevos.
5. Probar el QR de verificación escaneándolo con el celular apuntando a la URL de Vercel (no localhost).
