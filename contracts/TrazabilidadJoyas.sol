// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin v5 — en Remix se importan con esta ruta y Remix los baja solo.
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  TrazabilidadJoyas
 * @notice Sistema descentralizado de trazabilidad por roles para la cadena de
 *         valor de joyas preciosas (minera -> ... -> cliente final).
 *
 *         Cada PIEZA es un NFT (ERC-721) que acumula su historia completa a
 *         través de 7 hitos firmados criptográficamente por el actor que los
 *         registra (msg.sender). Los hitos son APPEND-ONLY: una vez escritos no
 *         se pueden modificar ni borrar.
 *
 *         El oro fungible se documenta como datos on-chain (peso + ley) dentro
 *         del hito de Refinería. Un token de oro ERC-20 transferible, de ser
 *         necesario, iría en un contrato aparte (no se puede heredar ERC-20 y
 *         ERC-721 en el mismo contrato por colisión de balanceOf).
 *
 * @dev    UNIDADES (se usan enteros para evitar decimales, que Solidity no maneja):
 *         - pesos en miligramos (mg)            -> 1 g  = 1000
 *         - ley/pureza en milésimas             -> 18k  = 750 ; oro puro = 999
 *         - quilates en centiquilates (ct x100) -> 1.50 ct = 150
 *         - precios en centavos (moneda off-chain)
 */
contract TrazabilidadJoyas is ERC721, AccessControl {
    // ----------------------------------------------------------------------
    //  ROLES (control de acceso segmentado)
    // ----------------------------------------------------------------------
    bytes32 public constant MINERA_ROLE        = keccak256("MINERA_ROLE");
    bytes32 public constant REFINERIA_ROLE     = keccak256("REFINERIA_ROLE");
    bytes32 public constant TALLADO_ROLE       = keccak256("TALLADO_ROLE");
    bytes32 public constant CERTIFICADORA_ROLE = keccak256("CERTIFICADORA_ROLE");
    bytes32 public constant MARCA_ROLE         = keccak256("MARCA_ROLE");
    bytes32 public constant JOYERIA_ROLE       = keccak256("JOYERIA_ROLE");

    // ----------------------------------------------------------------------
    //  ETAPAS — orden secuencial de la cadena
    // ----------------------------------------------------------------------
    // etapaActual[tokenId] guarda la PRÓXIMA etapa esperada para esa pieza.
    enum Etapa {
        Extraccion,     // 0 - aún no creada
        Refinado,       // 1
        Tallado,        // 2
        Certificacion,  // 3
        Ensamblado,     // 4
        Retail,         // 5
        Venta,          // 6
        Finalizada      // 7 - vendida al cliente
    }

    // ----------------------------------------------------------------------
    //  STRUCTS — un hito por rol (con los campos del formulario de la propuesta)
    //  Cada uno guarda automáticamente quién firmó (registradoPor) y cuándo.
    // ----------------------------------------------------------------------
    struct Extraccion {                 // 1. Minera
        string  idLote;
        string  tipoMineralBruto;
        uint256 pesoNetoMg;
        string  responsable;
        string  estadoInicial;
        address registradoPor;
        uint256 timestamp;
    }

    struct Refinado {                   // 2. Refinería (oro)
        string  idLoteEntrante;
        string  metodo;
        uint256 pesoPostMg;
        uint16  leyMilesimas;           // 750 = 18k
        address registradoPor;
        uint256 timestamp;
    }

    struct Tallado {                    // 3. Tallado (gema)
        string  idLoteRefinado;
        string  tipoCorte;
        uint256 pesoCentiquilates;
        uint16  cantidadPiezas;
        address registradoPor;
        uint256 timestamp;
    }

    struct Certificacion {              // 4. Certificadora (GIA)
        string  claridad;
        string  color;
        string  cut;
        uint256 pesoExactoCentiquilates;
        string  numeroCertificado;      // identificador único de la gema
        string  hashCertificadoIPFS;    // documento pesado -> IPFS
        address registradoPor;
        uint256 timestamp;
    }

    struct Ensamblado {                 // 5. Marca / Fabricación
        string  sku;
        string  metalSoporte;
        uint256 pesoMetalMg;
        string  disenador;
        address registradoPor;
        uint256 timestamp;
    }

    struct Retail {                     // 6. Joyería
        string  idTienda;
        uint256 precioCentavos;
        string  estadoExhibicion;
        string  codigoQR;
        address registradoPor;
        uint256 timestamp;
    }

    struct Venta {                      // 7. Cliente final
        string  idCliente;              // mail o identificador off-chain
        uint256 precioAbonadoCentavos;
        bool    garantiaActivada;
        address walletCliente;          // dueño final del NFT
        address registradoPor;
        uint256 timestamp;
    }

    // ----------------------------------------------------------------------
    //  ALMACENAMIENTO  (por tokenId)
    // ----------------------------------------------------------------------
    mapping(uint256 => Etapa)         public etapaActual;
    mapping(uint256 => Extraccion)    public extracciones;
    mapping(uint256 => Refinado)      public refinados;
    mapping(uint256 => Tallado)       public tallados;
    mapping(uint256 => Certificacion) public certificaciones;
    mapping(uint256 => Ensamblado)    public ensamblados;
    mapping(uint256 => Retail)        public retails;
    mapping(uint256 => Venta)         public ventas;

    // N° de certificado -> tokenId (garantiza unicidad del certificado)
    mapping(bytes32 => uint256) public certificadoATokenId;

    uint256 private _nextTokenId = 1;

    // ----------------------------------------------------------------------
    //  EVENTOS — para que el frontend (ethers.js) escuche cada hito
    // ----------------------------------------------------------------------
    event PiezaCreada(uint256 indexed tokenId, string idLote, address indexed minera);
    event RefinadoRegistrado(uint256 indexed tokenId, address indexed refineria);
    event TalladoRegistrado(uint256 indexed tokenId, address indexed tallador);
    event CertificacionRegistrada(uint256 indexed tokenId, string numeroCertificado, address indexed gemologo);
    event EnsambladoRegistrado(uint256 indexed tokenId, string sku, address indexed marca);
    event RetailRegistrado(uint256 indexed tokenId, string codigoQR, address indexed joyeria);
    event VentaRegistrada(uint256 indexed tokenId, address indexed walletCliente, address indexed joyeria);

    // ----------------------------------------------------------------------
    //  CONSTRUCTOR
    //  Quien deploya queda como ADMIN y puede asignar los roles a las wallets.
    // ----------------------------------------------------------------------
    constructor() ERC721("Trazabilidad Joyas", "TJOYA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  GESTIÓN DE ROLES (helper legible; equivale a grantRole de AccessControl)
    // ----------------------------------------------------------------------
    function asignarRol(bytes32 rol, address cuenta) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(rol, cuenta);
    }

    // ----------------------------------------------------------------------
    //  HITO 1 — EXTRACCIÓN (Minera). Crea (mintea) el NFT de la pieza.
    // ----------------------------------------------------------------------
    function registrarExtraccion(
        string calldata idLote,
        string calldata tipoMineralBruto,
        uint256 pesoNetoMg,
        string calldata responsable,
        string calldata estadoInicial
    ) external onlyRole(MINERA_ROLE) returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId); // el NFT nace en poder de la minera

        extracciones[tokenId] = Extraccion({
            idLote: idLote,
            tipoMineralBruto: tipoMineralBruto,
            pesoNetoMg: pesoNetoMg,
            responsable: responsable,
            estadoInicial: estadoInicial,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Refinado; // próxima etapa esperada
        emit PiezaCreada(tokenId, idLote, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 2 — REFINADO (Refinería / oro)
    // ----------------------------------------------------------------------
    function registrarRefinado(
        uint256 tokenId,
        string calldata idLoteEntrante,
        string calldata metodo,
        uint256 pesoPostMg,
        uint16 leyMilesimas
    ) external onlyRole(REFINERIA_ROLE) {
        _requireEtapa(tokenId, Etapa.Refinado);
        require(leyMilesimas <= 1000, "Ley invalida (max 1000)");

        refinados[tokenId] = Refinado({
            idLoteEntrante: idLoteEntrante,
            metodo: metodo,
            pesoPostMg: pesoPostMg,
            leyMilesimas: leyMilesimas,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Tallado;
        emit RefinadoRegistrado(tokenId, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 3 — TALLADO (gema)
    // ----------------------------------------------------------------------
    function registrarTallado(
        uint256 tokenId,
        string calldata idLoteRefinado,
        string calldata tipoCorte,
        uint256 pesoCentiquilates,
        uint16 cantidadPiezas
    ) external onlyRole(TALLADO_ROLE) {
        _requireEtapa(tokenId, Etapa.Tallado);

        tallados[tokenId] = Tallado({
            idLoteRefinado: idLoteRefinado,
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
    //  HITO 4 — CERTIFICACIÓN (Certificadora / GIA)
    // ----------------------------------------------------------------------
    // Datos de entrada de la certificación agrupados en un struct: así la
    // función recibe pocos argumentos y no desborda el stack ("Stack too deep").
    // El frontend (ethers.js) pasa estos campos como un objeto/tupla.
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

        // El n° de certificado debe ser único en todo el sistema.
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
    //  HITO 5 — ENSAMBLADO (Marca / Fabricación)
    // ----------------------------------------------------------------------
    function registrarEnsamblado(
        uint256 tokenId,
        string calldata sku,
        string calldata metalSoporte,
        uint256 pesoMetalMg,
        string calldata disenador
    ) external onlyRole(MARCA_ROLE) {
        _requireEtapa(tokenId, Etapa.Ensamblado);

        ensamblados[tokenId] = Ensamblado({
            sku: sku,
            metalSoporte: metalSoporte,
            pesoMetalMg: pesoMetalMg,
            disenador: disenador,
            registradoPor: msg.sender,
            timestamp: block.timestamp
        });

        etapaActual[tokenId] = Etapa.Retail;
        emit EnsambladoRegistrado(tokenId, sku, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 6 — RETAIL (Joyería)
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
    //  HITO 7 — VENTA (la Joyería vende y transfiere el NFT al cliente)
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
        // _transfer es interno: el propio contrato puede mover el token sin approve.
        _transfer(ownerOf(tokenId), walletCliente, tokenId);

        etapaActual[tokenId] = Etapa.Finalizada;
        emit VentaRegistrada(tokenId, walletCliente, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  LECTURA PÚBLICA — cualquiera puede verificar la historia (vía QR)
    // ----------------------------------------------------------------------
    function getEtapaActual(uint256 tokenId) external view returns (Etapa) {
        _requireExiste(tokenId);
        return etapaActual[tokenId];
    }

    // ----------------------------------------------------------------------
    //  HELPERS INTERNOS
    // ----------------------------------------------------------------------
    function _requireEtapa(uint256 tokenId, Etapa esperada) internal view {
        _requireExiste(tokenId);
        require(etapaActual[tokenId] == esperada, "Etapa incorrecta o hito ya registrado");
    }

    function _requireExiste(uint256 tokenId) internal view {
        // _ownerOf == address(0) -> el token no existe
        require(_ownerOf(tokenId) != address(0), "La pieza no existe");
    }

    // ----------------------------------------------------------------------
    //  OVERRIDE OBLIGATORIO — ERC721 + AccessControl ambos definen
    //  supportsInterface, hay que combinarlos.
    // ----------------------------------------------------------------------
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
