// ============================================================================
//  DOS CONTRATOS (bifurcación oro / gemas)
//  - JOYAS  : ERC-721, rama de la gema + pieza final (TrazabilidadJoyas.sol)
//  - ORO    : ERC-20, rama del oro fungible (OroToken.sol)
//  Pegá acá las direcciones que te da Remix al deployar CADA contrato en Sepolia.
// ============================================================================

export const JOYAS_ADDRESS = "0x8caE9a34d87acd181621C6288482D92BcDB043f3";

export const ORO_ADDRESS = "0x44541f7F08B20Ea53f12f16e512B77F330c9C08e";

// bytes32(0): el rol admin que da AccessControl a quien deployó cada contrato.
export const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// ---------------------------------------------------------------------------
//  ABI del contrato de la GEMA / pieza (ERC-721)
// ---------------------------------------------------------------------------
export const JOYAS_ABI = [
    // --- Roles / acceso ---
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function asignarRol(bytes32 rol, address cuenta)",

    // --- Registro de contratos (patrón registry/factory) ---
    "function oroTokenContract() view returns (address)",
    "function setOroTokenContract(address _oro)",

    // --- Registro de hitos de la gema ---
    "function registrarExtraccionGema(string idLote, string tipoGemaBruta, uint256 pesoBrutoCentiquilates, string responsable, string estadoInicial) returns (uint256)",
    "function registrarTallado(uint256 tokenId, string idLoteGema, string tipoCorte, uint256 pesoCentiquilates, uint16 cantidadPiezas)",
    "function registrarCertificacion(uint256 tokenId, (string claridad, string color, string cut, uint256 pesoExactoCentiquilates, string numeroCertificado, string hashCertificadoIPFS) datos)",
    "function registrarEnsamblado(uint256 tokenId, (string sku, string metalSoporte, uint256 pesoMetalMg, string disenador, string idLoteOro, uint256 oroConsumidoMg, uint16 leyOroMilesimas) datos)",
    "function registrarRetail(uint256 tokenId, string idTienda, uint256 precioCentavos, string estadoExhibicion, string codigoQR)",
    "function registrarVenta(uint256 tokenId, string idCliente, uint256 precioAbonadoCentavos, bool garantiaActivada, address walletCliente)",

    // --- Lectura ---
    "function getEtapaActual(uint256 tokenId) view returns (uint8)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function extracciones(uint256) view returns (string idLote, string tipoGemaBruta, uint256 pesoBrutoCentiquilates, string responsable, string estadoInicial, address registradoPor, uint256 timestamp)",
    "function tallados(uint256) view returns (string idLoteGema, string tipoCorte, uint256 pesoCentiquilates, uint16 cantidadPiezas, address registradoPor, uint256 timestamp)",
    "function certificaciones(uint256) view returns (string claridad, string color, string cut, uint256 pesoExactoCentiquilates, string numeroCertificado, string hashCertificadoIPFS, address registradoPor, uint256 timestamp)",
    "function getEnsamblado(uint256) view returns (string sku, string metalSoporte, uint256 pesoMetalMg, string disenador, address registradoPor, uint256 timestamp)",
    "function getOroDeEnsamblado(uint256) view returns (string idLoteOro, uint256 oroConsumidoMg, uint16 leyOroMilesimas)",
    "function retails(uint256) view returns (string idTienda, uint256 precioCentavos, string estadoExhibicion, string codigoQR, address registradoPor, uint256 timestamp)",
    "function ventas(uint256) view returns (string idCliente, uint256 precioAbonadoCentavos, bool garantiaActivada, address walletCliente, address registradoPor, uint256 timestamp)",

    // --- Eventos ---
    "event GemaCreada(uint256 indexed tokenId, string idLote, address indexed minera)",
    "event TalladoRegistrado(uint256 indexed tokenId, address indexed tallador)",
    "event CertificacionRegistrada(uint256 indexed tokenId, string numeroCertificado, address indexed gemologo)",
    "event EnsambladoRegistrado(uint256 indexed tokenId, string sku, uint256 oroConsumidoMg, address indexed marca)",
    "event RetailRegistrado(uint256 indexed tokenId, string codigoQR, address indexed joyeria)",
    "event VentaRegistrada(uint256 indexed tokenId, address indexed walletCliente, address indexed joyeria)",
] as const;

// ---------------------------------------------------------------------------
//  ABI del contrato del ORO (ERC-20)
// ---------------------------------------------------------------------------
export const ORO_ABI = [
    // --- Roles / acceso ---
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function asignarRol(bytes32 rol, address cuenta)",

    // --- Hitos de la rama del oro ---
    "function registrarExtraccionOro(string idLote, string tipoMineralBruto, uint256 pesoBrutoMg, string responsable, string estadoInicial)",
    "function registrarRefinado(string idLote, string metodo, uint256 pesoPostMg, uint16 leyMilesimas)",

    // --- ERC-20 estándar (el oro viaja entre actores) ---
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",

    // --- Registro de contratos (patrón registry/factory) + quema atómica ---
    "function joyasContract() view returns (address)",
    "function setJoyasContract(address _joyas)",
    "function burnFrom(address cuenta, uint256 tokenIdPieza, uint256 cantidadMg)",

    // --- Lectura del lote ---
    "function getLote(string idLote) view returns (tuple(string idLote, string tipoMineralBruto, string responsable, string estadoInicial, uint256 pesoBrutoMg, bool refinado, string metodo, uint256 pesoPostMg, uint16 leyMilesimas, address minera, address refineria, uint256 timestampExtraccion, uint256 timestampRefinado) lote)",
    "function loteExiste(string) view returns (bool)",

    // --- Eventos ---
    "event OroExtraido(string idLote, uint256 pesoBrutoMg, address indexed minera)",
    "event OroRefinado(string idLote, uint256 pesoPostMg, uint16 leyMilesimas, address indexed refineria)",
    "event OroConsumido(uint256 indexed tokenIdPieza, uint256 cantidadMg, address indexed marca)",
] as const;
