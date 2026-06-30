# Explicación del código paso a paso

## La idea en una frase

Cada **joya** se representa en la blockchain y va acumulando su historia desde la
mina hasta el cliente. Cada actor de la cadena firma su paso con su billetera, y
esos registros no se pueden modificar ni borrar. Cualquiera puede verificar el
origen y la autenticidad escaneando un QR, sin intermediarios.

## Por qué hay DOS contratos (la bifurcación)

La materia prima tiene dos naturalezas distintas, así que se modela con dos tokens:

- **OroToken.sol (ERC-20)** — el **oro es fungible**: un miligramo de oro es igual
  a cualquier otro. Se rastrea por peso y ley. Recorrido: Minera → Refinería.
- **TrazabilidadJoyas.sol (ERC-721)** — la **gema es única** (no fungible): es un
  NFT que evoluciona hasta ser la pieza final. Recorrido: Minera → Tallado →
  Certificadora.

Las dos ramas **convergen en el Ensamblado**, cuando la marca fabrica la pieza:
toma una gema (el NFT) y consume oro (lo quema). Se separan en dos contratos
porque ERC-20 y ERC-721 no pueden convivir en uno solo (colisionan en balanceOf).

---

## Las piezas del contrato

### Roles (quién puede hacer qué)

Cada función exige un rol. Como ahora hay dos contratos, los roles se reparten:

- En **OroToken**: minera, refinería, marca.
- En **TrazabilidadJoyas**: minera, tallado, certificadora, marca, joyería.

Cada actor recibe su rol y solo puede ejecutar la función que le corresponde. La
refinería no puede registrar la venta, la joyería no puede crear la gema, etc.
Quien sube el contrato queda como **administrador** y es el que reparte los roles
a cada wallet con la función `asignarRol`.

### Etapas (el orden obligatorio)

La gema avanza por un orden fijo, y el contrato lo obliga:

Extracción de gema → Tallado → Certificación → Ensamblado → Retail → Venta → Finalizada

El contrato lleva la cuenta de en qué etapa va cada pieza (`etapaActual`) y no te
deja saltearte pasos: no podés certificar algo que todavía no fue tallado. Cada
función, al terminar, "abre" la siguiente etapa.

(El **refinado del oro** ya no es una etapa del NFT: vive en el contrato del oro,
en su propia rama.)

### Structs (las fichas de datos)

Un struct es como una ficha con casilleros. Hay una por etapa. Por ejemplo, la
ficha de Extracción de gema guarda el id del lote, el tipo de gema, el peso, el
responsable, etc. Cada ficha además guarda automáticamente dos cosas:
`registradoPor` (la dirección de quien firmó) y `timestamp` (cuándo se hizo). Eso
es la "firma criptográfica" de la que habla el código.

### Enteros (sin decimales)

Como Solidity no maneja decimales, todo se guarda en enteros: los pesos del oro en
miligramos, la pureza del oro en milésimas (750 = 18 quilates), los quilates de la
gema en centiquilates (150 = 1.50 ct), y los precios en centavos.

---

## Cómo funciona en la práctica

### Rama del oro (contrato OroToken)

- **Extracción.** La minera llama a `registrarExtraccionOro`. Esto **mintea** los
  miligramos de oro como tokens ERC-20, que nacen en su billetera.
- **Refinado.** La refinería llama a `registrarRefinado` y le fija el método y la
  **ley** (750 = 18k) a ese lote.
- El oro, al ser un ERC-20, se puede **transferir** entre actores hasta llegar a
  la marca.

### Rama de la gema (contrato TrazabilidadJoyas)

- **Extracción de gema.** La minera llama a `registrarExtraccionGema`. Esto **crea
  el NFT** (lo "mintea") a nombre de la minera. Acá nace la pieza.
- **Tallado y Certificación.** Cada actor, en su turno, llama a su función. Antes
  de escribir nada, el contrato verifica dos cosas: que quien llama tenga el rol
  correcto, y que la pieza esté justo en la etapa esperada. Si está todo bien,
  guarda la ficha y avanza la etapa.
- La **certificación** tiene un cuidado extra: el número de certificado tiene que
  ser **único** en todo el sistema, así no se puede duplicar la identidad de una
  gema.

### La convergencia (Ensamblado)

La marca llama a `consumirOroParaPieza` en el contrato del oro, que **quema** el
oro que se usa para fabricar la joya. Después llama a `registrarEnsamblado` en el
NFT, donde deja registrado cuánto oro consumió, de qué lote y con qué ley. Acá las
dos ramas se unen en una sola pieza.

### Venta

La joyería registra el retail (la pieza en tienda con su QR) y después la venta.
Al registrar la venta, en el mismo movimiento **transfiere el NFT a la wallet del
cliente**. A partir de ahí el cliente es el dueño digital de la joya, y la pieza
queda marcada como "Finalizada".

### Lectura pública

Cualquiera puede consultar en qué etapa está una pieza y leer toda su historia
(incluida la rama del oro). Esto es lo que permite la verificación por QR.

---

## Detalles técnicos que vas a ver mencionados

- **Herencia de OpenZeppelin** (código probado y reutilizable): `ERC721` le da la
  lógica de los NFTs, `ERC20` la del token de oro, y `AccessControl` el control
  por roles. No se programan desde cero.
- **mint / burn**: "mint" es crear tokens (el oro al extraerse, el NFT al crearse
  la gema); "burn" es destruirlos (el oro al consumirse en el ensamblado).
- **Eventos**: cada función emite un "aviso" (`emit`) que el frontend escucha con
  ethers.js para actualizar la pantalla. No cambian nada en la blockchain.
- **IPFS**: el certificado pesado (PDF) se guarda en IPFS y on-chain queda solo su
  "hash" (huella digital), para no pagar gas de más.
- **keccak256**: función de hash. Se usa para los roles y para garantizar que el
  número de certificado sea único.
- **Structs como argumento** (DatosCertificacion, DatosEnsamblado): se agrupan los
  datos en un struct para que la función reciba pocos argumentos y no se pase del
  límite del stack de la EVM ("stack too deep").
- **supportsInterface**: como el contrato hereda ERC721 y AccessControl, que ambos
  definen esa función, hay que combinarlos con un override (es obligatorio).

---

## Por si te preguntan

- **¿Por qué blockchain y no una base de datos?** Porque una base la controla una
  empresa y la puede editar; la blockchain es inmutable y compartida.
- **¿Qué pasa si alguien quiere saltarse un paso?** No puede: `_requireEtapa`
  rechaza la transacción si la pieza no está en la etapa esperada.
- **¿Por qué dos contratos?** Por la bifurcación oro/gema de la propuesta, y porque
  ERC-20 y ERC-721 no pueden ir en el mismo contrato.
- **¿El cliente es un actor?** No firma un hito: recibe la propiedad del NFT. La
  joyería registra la venta y ejecuta la transferencia.
