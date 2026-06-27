# Guía de prueba — TrazabilidadJoyas

Cómo probar el smart contract de punta a punta en Remix + MetaMask (Sepolia).

## Datos del contrato

- **Dirección (Sepolia):** `0x25d24eB8577e93E0Aa6557791fB6841520214107`
- **Cuenta admin / deployer:** `0xA26E3e6f76fd2ed8250932DfF7F28cfB370efF3c`
- **Red:** Sepolia testnet

> Para una prueba rápida usamos **una sola cuenta** (la tuya) con **todos los roles**.
> En producción cada rol iría a una wallet distinta.

---

## Paso 0 — Cargar el contrato en Remix

1. Abrí Remix y compilá `TrazabilidadJoyas.sol` (Solidity 0.8.20+).
2. Pestaña **Deploy & Run** → Environment: **Injected Provider - MetaMask**.
3. Confirmá que MetaMask esté en **Sepolia** y tengas algo de SepoliaETH.
4. En el campo **"At Address"** pegá `0x25d24eB8577e93E0Aa6557791fB6841520214107` y hacé clic.
   - Aparecen abajo todos los botones del contrato con su estado actual.

> Si querés empezar de cero (contrato nuevo y vacío), en vez de "At Address" apretá **Deploy**.
> Vas a obtener una dirección nueva y los roles habrá que reasignarlos.

---

## Paso 1 — Asignar los 6 roles (a tu propia cuenta)

Para cada rol, en la función **`asignarRol`** poné el valor del rol en `rol` y tu dirección en `cuenta`.

> **Importante:** pegá SOLO el valor que empieza en `0x`. No incluyas el prefijo `0: bytes32:` que muestra Remix.

| Rol | Valor para el campo `rol` |
|-----|---------------------------|
| MINERA_ROLE | `0x56827d4be2846122986c053b9505dd2904166b33762d1b3ef3bf178c6040b8cc` |
| REFINERIA_ROLE | `0x588b8f4afa91c9340332146429551e0d6de3e3e474ec0be40a7c748f43a97ffe` |
| TALLADO_ROLE | `0x1b81515b8d451a1bd1a9e572d5ac809fe9eacce084c27398ae4d3472d404b50e` |
| CERTIFICADORA_ROLE | `0x7be5f6aa320f85547aaa0e947c7d4519a3973e1bfd6f022409ec64755845ebd7` |
| MARCA_ROLE | `0xeecba7db0811f0eec0bd134c9a8fa2e4b8c750be87cc8f1bcee9d82808e9fe69` |
| JOYERIA_ROLE | `0xbbe0006b9ae3e0a533e78b251c3ad4ed6e20e885e2745da84fb26e75d1ab0a20` |

`cuenta` = `0xA26E3e6f76fd2ed8250932DfF7F28cfB370efF3c`

Cada `asignarRol` es una transacción → confirmá en MetaMask (6 en total).

> **Verificación opcional:** `hasRole(rol, cuenta)` debe devolver `true`.

---

## Paso 2 — Correr el flujo de los 7 hitos (EN ORDEN)

El contrato obliga a seguir el orden. Si te salteás un paso, da
`"Etapa incorrecta o hito ya registrado"`.

### Hito 1 — Extracción (Minera)
```
registrarExtraccion("LOTE-001", "Oro bruto + zafiro", 50000, "Juan Perez", "extraido")
```
- Devuelve `tokenId = 1`.
- Campos: idLote, tipoMineralBruto, pesoNetoMg (50000 mg = 50 g), responsable, estadoInicial.

### Hito 2 — Refinado (Refinería)
```
registrarRefinado(1, "LOTE-001", "fundicion", 48000, 750)
```
- tokenId, idLoteEntrante, método, pesoPostMg, leyMilésimas (750 = 18k).

### Hito 3 — Tallado
```
registrarTallado(1, "LOTE-001", "brillante", 150, 1)
```
- tokenId, idLoteRefinado, tipoCorte, pesoCentiquilates (150 = 1.50 ct), cantidadPiezas.

### Hito 4 — Certificación (GIA)
Esta función recibe `tokenId` y un **struct (tupla entre corchetes)**:
```
tokenId: 1
datos:   ["VS1", "D", "Excelente", 150, "GIA-0001", "QmHashIPFSdelCertificado"]
```
- Orden de la tupla: claridad, color, cut, pesoExactoCentiquilates, numeroCertificado, hashIPFS.

### Hito 5 — Ensamblado (Marca)
```
registrarEnsamblado(1, "SKU-ANILLO-01", "oro 18k", 6000, "Maria Lopez")
```
- tokenId, sku, metalSoporte, pesoMetalMg, diseñador.

### Hito 6 — Retail (Joyería)
```
registrarRetail(1, "Tienda Centro", 250000000, "en vitrina", "QR-001")
```
- tokenId, idTienda, precioCentavos (250000000 = $2.500.000,00), estadoExhibición, codigoQR.

### Hito 7 — Venta (Joyería vende y transfiere el NFT al cliente)
```
registrarVenta(1, "cliente@mail.com", 250000000, true, 0x<wallet_del_cliente>)
```
- tokenId, idCliente, precioAbonadoCentavos, garantiaActivada, walletCliente.
- Como wallet del cliente podés usar otra cuenta de MetaMask, o tu misma dirección para la prueba.

---

## Paso 3 — Verificar la historia

Después de cada hito (y al final), leé el estado con los botones azules (no gastan gas):

- `etapaActual(1)` → muestra en qué etapa va (0=Extraccion … 7=Finalizada).
- `extracciones(1)`, `refinados(1)`, `tallados(1)`, `certificaciones(1)`, `ensamblados(1)`, `retails(1)`, `ventas(1)` → devuelven los datos guardados, incluyendo `registradoPor` (la wallet que firmó) y `timestamp`.
- `ownerOf(1)` → al final debe devolver la **wallet del cliente**: el NFT se transfirió en la venta. ✅
- `certificadoATokenId(keccak del número)` → no hace falta; sirve para verificar unicidad del certificado.

---

## Checklist de que todo funcionó

- [ ] Los 6 roles asignados (`hasRole` = true).
- [ ] `registrarExtraccion` devolvió `tokenId = 1`.
- [ ] Los 7 hitos se registraron sin error, en orden.
- [ ] `etapaActual(1)` = 7 (Finalizada).
- [ ] `ownerOf(1)` = wallet del cliente.
- [ ] Probar que la seguridad funciona: intentá un hito desde una cuenta SIN el rol → debe fallar con `AccessControlUnauthorizedAccount`.
- [ ] Probar el orden: intentá saltear un paso → debe fallar con `"Etapa incorrecta..."`.

---

## Errores comunes (y qué significan)

| Error | Causa | Solución |
|-------|-------|----------|
| `AccessControlUnauthorizedAccount` | La cuenta no tiene el rol | Asigná el rol con `asignarRol` (Paso 1) |
| `Etapa incorrecta o hito ya registrado` | Te salteaste un paso o ya lo registraste | Respetá el orden de los 7 hitos |
| `invalid BytesLike value ("0: bytes32: ...")` | Copiaste el prefijo de Remix | Pegá solo el valor `0x...` |
| `Stack too deep` (al compilar) | Demasiados parámetros | Ya resuelto con struct de entrada |
| Gas estimation failed / fee en rojo | Sin SepoliaETH | Conseguí test ETH de un faucet |
| `user rejected` | Rechazaste en MetaMask | Volvé a llamar y confirmá |
