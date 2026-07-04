// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin v5 (Remix los baja solo).
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Interfaz minima del contrato de oro: solo lo que necesitamos llamar desde
// aca (la quema atomica al ensamblar). No importamos el contrato entero para
// no acoplar los dos artifacts de compilacion.
interface IOroToken {
    function burnFrom(address cuenta, uint256 tokenIdPieza, uint256 cantidadMg) external;
}

/**
 * @title  TrazabilidadJoyas
 * @notice RAMA DE LA GEMA (no fungible) + pieza final de la trazabilidad.
 *
 *         Cada GEMA es un NFT (ERC-721) unico. Ese mismo NFT va evolucionando
 *         hasta convertirse en la PIEZA FINAL que recibe el cliente. Acumula su
 *         historia en hitos APPEND-ONLY (no se editan ni borran) firmados por el
 *         actor que los registra (msg.sender).
 *
 *         RECORRIDO BIFURCADO (segun la propuesta):
 *           - Rama ORO  : Minera -> Refineria            (contrato OroToken, ERC-20)
 *           - Rama GEMA : Minera -> Tallado -> Certificadora   (este contrato)
 *         Las dos ramas CONVERGEN en el hito de ENSAMBLADO: la Marca consume oro
 *         (lo quema en OroToken) y lo deja registrado en el NFT de la pieza.
 *
 * @dev    UNIDADES (enteros, Solidity no maneja decimales):
 *         - quilates en centiquilates (ct x100) -> 1.50 ct = 150
 *         - pesos de metal en miligramos (mg)
 *         - ley/pureza del oro en milesimas (750 = 18k)
 *         - precios en centavos (moneda off-chain)
 */
contract TrazabilidadJoyas is ERC721, AccessControl {
    // ----------------------------------------------------------------------
    //  ROLES (la refineria vive en OroToken, no aca)
    // ----------------------------------------------------------------------
    bytes32 public constant MINERA_ROLE        = keccak256("MINERA_ROLE");
    bytes32 public constant TALLADO_ROLE       = keccak256("TALLADO_ROLE");
    bytes32 public constant CERTIFICADORA_ROLE = keccak256("CERTIFICADORA_ROLE");
    bytes32 public constant MARCA_ROLE         = keccak256("MARCA_ROLE");
    bytes32 public constant JOYERIA_ROLE       = keccak256("JOYERIA_ROLE");

    // ----------------------------------------------------------------------
    //  ETAPAS — orden secuencial de la rama de la gema.
    //  etapaActual[tokenId] guarda la PROXIMA etapa esperada.
    // ----------------------------------------------------------------------
    enum Etapa {
        ExtraccionGema, // 0 - aun no creada
        Tallado,        // 1
        Certificacion,  // 2
        Ensamblado,     // 3 - CONVERGENCIA con el oro
        Retail,         // 4
        Venta,          // 5
        Finalizada      // 6 - vendida al cliente
    }

    // ----------------------------------------------------------------------
    //  STRUCTS — un hito por rol. Cada uno guarda quien firmo y cuando.
    // ----------------------------------------------------------------------
    struct ExtraccionGema {             // 1. Minera (gema en bruto)
        string  idLote;
        string  tipoGemaBruta;
        uint256 pesoBrutoCentiquilates;
        string  responsable;
        string  estadoInicial;
        address registradoPor;
        uint256 timestamp;
    }

    struct Tallado {                    // 2. Tallado (corte de la gema)
        string  idLoteGema;
        string  tipoCorte;
        uint256 pesoCentiquilates;
        uint16  cantidadPiezas;
        address registradoPor;
        uint256 timestamp;
    }

    struct Certificacion {              // 3. Certificadora (GIA)
        string  claridad;
        string  color;
        string  cut;
        uint256 pesoExactoCentiquilates;
        string  numeroCertificado;      // identificador unico de la gema
        string  hashCertificadoIPFS;    // documento pesado -> IPFS
        address registradoPor;
        uint256 timestamp;
    }

    struct Ensamblado {                 // 4. Marca — CONVERGENCIA oro + gema
        string  sku;
        string  metalSoporte;
        uint256 pesoMetalMg;
        string  disenador;
        // --- referencia al oro consumido (rama ORO) ---
        string  idLoteOro;              // que lote de oro se uso
        uint256 oroConsumidoMg;         // cuanto oro se quemo en OroToken
        uint16  leyOroMilesimas;        // ley de ese oro (750 = 18k)
        address registradoPor;
        uint256 timestamp;
    }

    struct Retail {                     // 5. Joyeria
        string  idTienda;
        uint256 precioCentavos;
        string  estadoExhibicion;
        string  codigoQR;
        address registradoPor;
        uint256 timestamp;
    }

    struct Venta {                      // 6. Cliente final
        string  idCliente;
        uint256 precioAbonadoCentavos;
        bool    garantiaActivada;
        address walletCliente;          // dueno final del NFT
        address registradoPor;
        uint256 timestamp;
    }

    // ----------------------------------------------------------------------
    //  ALMACENAMIENTO  (por tokenId)
    // ----------------------------------------------------------------------
    mapping(uint256 => Etapa) public etapaActual;
    mapping(uint256 => ExtraccionGema) public extracciones;
    mapping(uint256 => Tallado)        public tallados;
    mapping(uint256 => Certificacion)  public certificaciones;
    // 'ensamblados' es internal: su struct (11 campos) desbordaria el stack con
    // el getter automatico. Se expone con getEnsamblado() (struct en memoria).
    mapping(uint256 => Ensamblado)     internal ensamblados;
    mapping(uint256 => Retail)         public retails;
    mapping(uint256 => Venta)          public ventas;

    // N° de certificado -> tokenId (garantiza unicidad del certificado)
    mapping(bytes32 => uint256) public certificadoATokenId;

    uint256 private _nextTokenId = 1;

    // ----------------------------------------------------------------------
    //  EVENTOS — para el front (ethers.js)
    // ----------------------------------------------------------------------
    event GemaCreada(uint256 indexed tokenId, string idLote, address indexed minera);
    event TalladoRegistrado(uint256 indexed tokenId, address indexed tallador);
    event CertificacionRegistrada(uint256 indexed tokenId, string numeroCertificado, address indexed gemologo);
    event EnsambladoRegistrado(uint256 indexed tokenId, string sku, uint256 oroConsumidoMg, address indexed marca);
    event RetailRegistrado(uint256 indexed tokenId, string codigoQR, address indexed joyeria);
    event VentaRegistrada(uint256 indexed tokenId, address indexed walletCliente, address indexed joyeria);

    // ----------------------------------------------------------------------
    //  CONSTRUCTOR — quien deploya queda ADMIN y reparte roles.
    // ----------------------------------------------------------------------
    constructor() ERC721("Trazabilidad Joyas", "TJOYA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function asignarRol(bytes32 rol, address cuenta) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(rol, cuenta);
    }

    // ----------------------------------------------------------------------
    //  REGISTRO DE CONTRATOS (patron "registry"/factory) — direccion del
    //  contrato de oro, actualizable por el admin sin tener que redeployar
    //  este contrato si el dia de mañana cambia OroToken.
    // ----------------------------------------------------------------------
    address public oroTokenContract;

    function setOroTokenContract(address _oro) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oro != address(0), "Direccion invalida");
        oroTokenContract = _oro;
    }

    // ----------------------------------------------------------------------
    //  HITO 1 (GEMA) — EXTRACCION (Minera). Crea (mintea) el NFT de la gema.
    // ----------------------------------------------------------------------
    function registrarExtraccionGema(
        string calldata idLote,
        string calldata tipoGemaBruta,
        uint256 pesoBrutoCentiquilates,
        string calldata responsable,
        string calldata estadoInicial
    ) external onlyRole(MINERA_ROLE) returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId); // el NFT nace en poder de la minera

        extracciones[tokenId] = ExtraccionGema({
            idLote: idLote,
            tipoGemaBruta: tipoGemaBruta,
            pesoBrutoCentiquilates: pesoBrutoCentiquilates,
            responsable: responsable,
            estadoInicial: estadoInicial,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Tallado;
        emit GemaCreada(tokenId, idLote, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 2 (GEMA) — TALLADO
    // ----------------------------------------------------------------------
    function registrarTallado(
        uint256 tokenId,
        string calldata idLoteGema,
        string calldata tipoCorte,
        uint256 pesoCentiquilates,
        uint16 cantidadPiezas
    ) external onlyRole(TALLADO_ROLE) {
        _requireEtapa(tokenId, Etapa.Tallado);

        tallados[tokenId] = Tallado({
            idLoteGema: idLoteGema,
            tipoCorte: tipoCorte,
            pesoCentiquilates: pesoCentiquilates,
            cantidadPiezas: cantidadPiezas,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Certificacion;
        emit TalladoRegistrado(tokenId, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 3 (GEMA) — CERTIFICACION (GIA)
    //  Datos agrupados en struct para no desbordar el stack ("Stack too deep").
    // ----------------------------------------------------------------------
    struct DatosCertificacion {
        string  claridad;
        string  color;
        string  cut;
        uint256 pesoExactoCentiquilates;
        string  numeroCertificado;
        string  hashCertificadoIPFS;
    }

    function registrarCertificacion(uint256 tokenId, DatosCertificacion calldata datos)
        external
        onlyRole(CERTIFICADORA_ROLE)
    {
        _requireEtapa(tokenId, Etapa.Certificacion);

        // El n° de certificado debe ser unico en todo el sistema.
        bytes32 clave = keccak256(bytes(datos.numeroCertificado));
        require(certificadoATokenId[clave] == 0, "Certificado ya usado");
        certificadoATokenId[clave] = tokenId;

        Certificacion storage c = certificaciones[tokenId];
        c.claridad = datos.claridad;
        c.color = datos.color;
        c.cut = datos.cut;
        c.pesoExactoCentiquilates = datos.pesoExactoCentiquilates;
        c.numeroCertificado = datos.numeroCertificado;
        c.hashCertificadoIPFS = datos.hashCertificadoIPFS;
        c.registradoPor = msg.sender;
        c.timestamp = block.timestamp;

        etapaActual[tokenId] = Etapa.Ensamblado;
        emit CertificacionRegistrada(tokenId, datos.numeroCertificado, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 4 — ENSAMBLADO (Marca). CONVERGENCIA de las dos ramas.
    //  La Marca primero hace oro.approve(direccionDeEsteContrato, oroConsumidoMg)
    //  en OroToken. Esta funcion, en la MISMA transaccion, quema ese oro
    //  (burnFrom) y deja registrada en el NFT la referencia (lote, mg y ley).
    //  Si la Marca no tiene ese oro, la transaccion entera revierte.
    // ----------------------------------------------------------------------
    // Datos del ensamblado agrupados en un struct: asi la funcion recibe pocos
    // argumentos y no desborda el stack ("Stack too deep"). El front (ethers.js)
    // pasa estos campos como un objeto/tupla.
    struct DatosEnsamblado {
        string  sku;
        string  metalSoporte;
        uint256 pesoMetalMg;
        string  disenador;
        string  idLoteOro;          // que lote de oro se uso (rama ORO)
        uint256 oroConsumidoMg;     // cuanto oro se quemo en OroToken
        uint16  leyOroMilesimas;    // ley de ese oro (750 = 18k)
    }

    function registrarEnsamblado(uint256 tokenId, DatosEnsamblado calldata datos)
        external
        onlyRole(MARCA_ROLE)
    {
        _requireEtapa(tokenId, Etapa.Ensamblado);
        require(datos.leyOroMilesimas <= 1000, "Ley invalida (max 1000)");
        require(oroTokenContract != address(0), "Contrato de oro no configurado (setOroTokenContract)");

        // VALIDACION REAL DEL ORO: esto quema datos.oroConsumidoMg del oro
        // que tiene la Marca en OroToken. Si la Marca no tiene esa cantidad
        // (por ejemplo, quiere poner 55.000mg cuando solo se extrajeron/
        // refinaron 48.000mg en toda la cadena), esta linea revierte la
        // transaccion entera: NO se puede registrar una pieza con mas oro
        // del que realmente existe. Requiere que la Marca haya hecho antes
        // oro.approve(direccionDeEsteContrato, oroConsumidoMg).
        IOroToken(oroTokenContract).burnFrom(msg.sender, tokenId, datos.oroConsumidoMg);

        Ensamblado storage e = ensamblados[tokenId];
        e.sku = datos.sku;
        e.metalSoporte = datos.metalSoporte;
        e.pesoMetalMg = datos.pesoMetalMg;
        e.disenador = datos.disenador;
        e.idLoteOro = datos.idLoteOro;
        e.oroConsumidoMg = datos.oroConsumidoMg;
        e.leyOroMilesimas = datos.leyOroMilesimas;
        e.registradoPor = msg.sender;
        e.timestamp = block.timestamp;

        etapaActual[tokenId] = Etapa.Retail;
        emit EnsambladoRegistrado(tokenId, datos.sku, datos.oroConsumidoMg, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 5 — RETAIL (Joyeria)
    // ----------------------------------------------------------------------
    function registrarRetail(
        uint256 tokenId,
        string calldata idTienda,
        uint256 precioCentavos,
        string calldata estadoExhibicion,
        string calldata codigoQR
    ) external onlyRole(JOYERIA_ROLE) {
        _requireEtapa(tokenId, Etapa.Retail);

        retails[tokenId] = Retail({
            idTienda: idTienda,
            precioCentavos: precioCentavos,
            estadoExhibicion: estadoExhibicion,
            codigoQR: codigoQR,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Venta;
        emit RetailRegistrado(tokenId, codigoQR, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 6 — VENTA (la Joyeria vende y transfiere el NFT al cliente)
    // ----------------------------------------------------------------------
    function registrarVenta(
        uint256 tokenId,
        string calldata idCliente,
        uint256 precioAbonadoCentavos,
        bool garantiaActivada,
        address walletCliente
    ) external onlyRole(JOYERIA_ROLE) {
        _requireEtapa(tokenId, Etapa.Venta);
        require(walletCliente != address(0), "Wallet cliente invalida");

        ventas[tokenId] = Venta({
            idCliente: idCliente,
            precioAbonadoCentavos: precioAbonadoCentavos,
            garantiaActivada: garantiaActivada,
            walletCliente: walletCliente,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        // Transferimos la propiedad del NFT al cliente final.
        _transfer(ownerOf(tokenId), walletCliente, tokenId);

        etapaActual[tokenId] = Etapa.Finalizada;
        emit VentaRegistrada(tokenId, walletCliente, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  LECTURA PUBLICA — cualquiera verifica la historia (via QR)
    // ----------------------------------------------------------------------
    function getEtapaActual(uint256 tokenId) external view returns (Etapa) {
        _requireExiste(tokenId);
        return etapaActual[tokenId];
    }

    // Lectura del ensamblado, partida en dos para no desbordar el stack al
    // codificar el retorno (el struct completo de 11 campos quedaba "1 slot
    // too deep"). Una funcion devuelve los datos de la pieza y la otra la
    // referencia al oro consumido.
    function getEnsamblado(uint256 tokenId)
        external
        view
        returns (
            string memory sku,
            string memory metalSoporte,
            uint256 pesoMetalMg,
            string memory disenador,
            address registradoPor,
            uint256 timestamp
        )
    {
        Ensamblado storage e = ensamblados[tokenId];
        return (e.sku, e.metalSoporte, e.pesoMetalMg, e.disenador, e.registradoPor, e.timestamp);
    }

    // Referencia al oro consumido en el ensamblado (rama ORO), separada de
    // getEnsamblado() por el mismo motivo ("Stack too deep" al devolver
    // demasiados valores juntos).
    function getOroDeEnsamblado(uint256 tokenId)
        external
        view
        returns (
            string memory idLoteOro,
            uint256 oroConsumidoMg,
            uint16 leyOroMilesimas
        )
    {
        Ensamblado storage e = ensamblados[tokenId];
        return (e.idLoteOro, e.oroConsumidoMg, e.leyOroMilesimas);
    }

    // ----------------------------------------------------------------------
    //  HELPERS INTERNOS
    // ----------------------------------------------------------------------

    // OZ v5: ownerOf() PUBLICO revierte solo si no existe; _ownerOf() interno
    // devuelve address(0) sin revertir, asi podemos chequear existencia limpio.
    function _requireExiste(uint256 tokenId) internal view {
        require(_ownerOf(tokenId) != address(0), "Pieza inexistente");
    }

    // Valida que la pieza este en la etapa que este hito espera, y de paso
    // valida que exista. Si alguien intenta registrar un hito fuera de orden
    // (ej. Tallado antes que exista la gema, o dos veces el mismo hito), revierte.
    function _requireEtapa(uint256 tokenId, Etapa esperada) internal view {
        _requireExiste(tokenId);
        require(etapaActual[tokenId] == esperada, "Etapa incorrecta para esta operacion");
    }

    // ERC721 y AccessControl heredan las dos de ERC165 y cada una implementa
    // supportsInterface() a su manera. Solidity obliga a resolver ese choque
    // "a mano" indicando explicitamente las dos bases y llamando a super
    // (que hace OR entre las dos implementaciones).
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
   