export const CONTRACT_ADDRESS = "0x25d24eB8577e93E0Aa6557791fB6841520214107";

export const CONTRACT_ABI = [
    // --- Roles / acceso ---
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function asignarRol(bytes32 rol, address cuenta)",

    // --- Registro de los 7 hitos ---
    "function registrarExtraccion(string idLote, string tipoMineralBruto, uint256 pesoNetoMg, string responsable, string estadoInicial) returns (uint256)",
    "function registrarRefinado(uint256 tokenId, string idLoteEntrante, string metodo, uint256 pesoPostMg, uint16 leyMilesimas)",
    "function registrarTallado(uint256 tokenId, string idLoteRefinado, string tipoCorte, uint256 pesoCentiquilates, uint16 cantidadPiezas)",
    "function registrarCertificacion(uint256 tokenId, (string claridad, string color, string cut, uint256 pesoExactoCentiquilates, string numeroCertificado, string hashCertificadoIPFS) datos)",
    "function registrarEnsamblado(uint256 tokenId, string sku, string metalSoporte, uint256 pesoMetalMg, string disenador)",
    "function registrarRetail(uint256 tokenId, string idTienda, uint256 precioCentavos, string estadoExhibicion, string codigoQR)",
    "function registrarVenta(uint256 tokenId, string idCliente, uint256 precioAbonadoCentavos, bool garantiaActivada, address walletCliente)",

    // --- Lectura ---
    "function getEtapaActual(uint256 tokenId) view returns (uint8)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function extracciones(uint256) view returns (string idLote, string tipoMineralBruto, uint256 pesoNetoMg, string responsable, string estadoInicial, address registradoPor, uint256 timestamp)",
    "function refinados(uint256) view returns (string idLoteEntrante, string metodo, uint256 pesoPostMg, uint16 leyMilesimas, address registradoPor, uint256 timestamp)",
    "function tallados(uint256) view returns (string idLoteRefinado, string tipoCorte, uint256 pesoCentiquilates, uint16 cantidadPiezas, address registradoPor, uint256 timestamp)",
    "function certificaciones(uint256) view returns (string claridad, string color, string cut, uint256 pesoExactoCentiquilates, string numeroCertificado, string hashCertificadoIPFS, address registradoPor, uint256 timestamp)",
    "function ensamblados(uint256) view returns (string sku, string metalSoporte, uint256 pesoMetalMg, string disenador, address registradoPor, uint256 timestamp)",
    "function retails(uint256) view returns (string idTienda, uint256 precioCentavos, string estadoExhibicion, string codigoQR, address registradoPor, uint256 timestamp)",
    "function ventas(uint256) view returns (string idCliente, uint256 precioAbonadoCentavos, bool garantiaActivada, address walletCliente, address registradoPor, uint256 timestamp)",

    // --- Eventos ---
    "event PiezaCreada(uint256 indexed tokenId, string idLote, address indexed minera)",
    "event RefinadoRegistrado(uint256 indexed tokenId, address indexed refineria)",
    "event TalladoRegistrado(uint256 indexed tokenId, address indexed tallador)",
    "event CertificacionRegistrada(uint256 indexed tokenId, string numeroCertificado, address indexed gemologo)",
    "event EnsambladoRegistrado(uint256 indexed tokenId, string sku, address indexed marca)",
    "event RetailRegistrado(uint256 indexed tokenId, string codigoQR, address indexed joyeria)",
    "event VentaRegistrada(uint256 indexed tokenId, address indexed walletCliente, address indexed joyeria)",
] as const;