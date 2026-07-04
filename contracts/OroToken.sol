// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin v5 (Remix los baja solo).
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title  OroToken
 * @notice RAMA DEL ORO (fungible) de la trazabilidad de joyas.
 *
 *         El oro es FUNGIBLE: un miligramo de oro es igual a cualquier otro, se
 *         mezcla en lotes y se rastrea por peso y ley. Por eso se modela como un
 *         token ERC-20, separado del NFT de las gemas (no se puede heredar ERC-20
 *         y ERC-721 en el mismo contrato: colisionan en balanceOf).
 *
 *         Recorrido de la rama:  Minera (extrae) -> Refineria (refina) -> ... ->
 *         Marca (consume el oro al fabricar la pieza = se QUEMA).
 *
 * @dev    UNIDAD: 1 token = 1 miligramo (mg) de oro. Por eso decimals() = 0.
 *         Ley/pureza en milesimas: 750 = 18k ; oro puro = 999.
 *
 *         mint  -> cuando la minera registra la extraccion (nace el oro).
 *         burn  -> cuando la marca consume oro para ensamblar la pieza.
 *         transfer -> estandar ERC-20: el oro viaja minera -> refineria -> marca.
 */
contract OroToken is ERC20, AccessControl {
    // ----------------------------------------------------------------------
    //  ROLES de la rama del oro
    // ----------------------------------------------------------------------
    bytes32 public constant MINERA_ROLE    = keccak256("MINERA_ROLE");
    bytes32 public constant REFINERIA_ROLE = keccak256("REFINERIA_ROLE");
    bytes32 public constant MARCA_ROLE     = keccak256("MARCA_ROLE");

    // ----------------------------------------------------------------------
    //  LOTE DE ORO  (la historia on-chain de cada lote, por su idLote)
    // ----------------------------------------------------------------------
    struct LoteOro {
        string  idLote;
        string  tipoMineralBruto;
        string  responsable;
        string  estadoInicial;
        uint256 pesoBrutoMg;        // mg minteados en la extraccion
        // --- datos que agrega la refineria ---
        bool    refinado;
        string  metodo;
        uint256 pesoPostMg;         // mg de oro fino tras refinar (dato)
        uint16  leyMilesimas;       // 750 = 18k
        // --- firmas / tiempos ---
        address minera;
        address refineria;
        uint256 timestampExtraccion;
        uint256 timestampRefinado;
    }

    // 'lotes' es internal: el getter automatico de un struct de 13 campos
    // desborda el stack ("Stack too deep"). En su lugar exponemos getLote(),
    // que devuelve el struct entero en memoria (un solo valor, sin desborde).
    mapping(string => LoteOro) internal lotes;      // idLote -> datos del lote
    mapping(string => bool)    public  loteExiste;  // idLote -> ya registrado?

    // Lectura publica del lote completo (reemplaza al getter automatico).
    function getLote(string calldata idLote) external view returns (LoteOro memory) {
        return lotes[idLote];
    }

    // ----------------------------------------------------------------------
    //  EVENTOS (para que el front escuche con ethers.js)
    // ----------------------------------------------------------------------
    event OroExtraido(string idLote, uint256 pesoBrutoMg, address indexed minera);
    event OroRefinado(string idLote, uint256 pesoPostMg, uint16 leyMilesimas, address indexed refineria);
    event OroConsumido(uint256 indexed tokenIdPieza, uint256 cantidadMg, address indexed marca);

    // ----------------------------------------------------------------------
    //  CONSTRUCTOR: quien deploya queda ADMIN y reparte roles.
    // ----------------------------------------------------------------------
    constructor() ERC20("Oro Trazable", "ORO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // 1 token = 1 mg de oro -> sin decimales.
    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function asignarRol(bytes32 rol, address cuenta) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(rol, cuenta);
    }

    // ----------------------------------------------------------------------
    //  HITO 1 (ORO) — EXTRACCION (Minera). Mintea los mg de oro bruto.
    // ----------------------------------------------------------------------
    function registrarExtraccionOro(
        string calldata idLote,
        string calldata tipoMineralBruto,
        uint256 pesoBrutoMg,
        string calldata responsable,
        string calldata estadoInicial
    ) external onlyRole(MINERA_ROLE) {
        require(!loteExiste[idLote], "Lote ya existe");
        require(pesoBrutoMg > 0, "Peso debe ser > 0");

        loteExiste[idLote] = true;
        lotes[idLote] = LoteOro({
            idLote: idLote,
            tipoMineralBruto: tipoMineralBruto,
            responsable: responsable,
            estadoInicial: estadoInicial,
            pesoBrutoMg: pesoBrutoMg,
            refinado: false,
            metodo: "",
            pesoPostMg: 0,
            leyMilesimas: 0,
            minera: msg.sender,
            refineria: address(0),
            timestampExtraccion: block.timestamp,
            timestampRefinado: 0
        });

        // Nacen los tokens de oro en poder de la minera.
        _mint(msg.sender, pesoBrutoMg);
        emit OroExtraido(idLote, pesoBrutoMg, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  HITO 2 (ORO) — REFINADO (Refineria). Fija metodo, peso fino y ley.
    //  El oro fisico ya debe estar en la wallet de la refineria (transfer ERC-20).
    // ----------------------------------------------------------------------
    function registrarRefinado(
        string calldata idLote,
        string calldata metodo,
        uint256 pesoPostMg,
        uint16  leyMilesimas
    ) external onlyRole(REFINERIA_ROLE) {
        require(loteExiste[idLote], "Lote inexistente");
        require(leyMilesimas <= 1000, "Ley invalida (max 1000)");

        LoteOro storage l = lotes[idLote];
        require(!l.refinado, "Lote ya refinado");

        l.refinado = true;
        l.metodo = metodo;
        l.pesoPostMg = pesoPostMg;
        l.leyMilesimas = leyMilesimas;
        l.refineria = msg.sender;
        l.timestampRefinado = block.timestamp;

        emit OroRefinado(idLote, pesoPostMg, leyMilesimas, msg.sender);
    }

    // ----------------------------------------------------------------------
    //  REGISTRO DE CONTRATOS (patron "registry"/factory que pidio el profesor)
    //  En vez de que este contrato y TrazabilidadJoyas queden atados para
    //  siempre a una direccion fija del otro, cada uno guarda la direccion del
    //  otro en una variable que el ADMIN puede actualizar. Asi, si el dia de
    //  mañana se corrige o se re-despliega SOLO uno de los dos contratos, no
    //  hace falta volver a desplegar el otro: simplemente se llama a esta
    //  funcion con la nueva direccion.
    // ----------------------------------------------------------------------
    address public joyasContract;

    function setJoyasContract(address _joyas) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_joyas != address(0), "Direccion invalida");
        joyasContract = _joyas;
    }

    // ----------------------------------------------------------------------
    //  CONVERGENCIA — La marca CONSUME (quema) oro para fabricar la pieza NFT.
    //
    //  Antes esto se hacia en 2 pasos sueltos (la marca quemaba oro aca, y
    //  por separado cargaba a mano un numero en TrazabilidadJoyas.registrarEnsamblado):
    //  nada garantizaba que los dos numeros fueran el mismo, ni que el oro
    //  cargado en el NFT realmente hubiese existido. Ahora esta funcion solo
    //  puede ser llamada por el contrato de Joyas (ver joyasContract), DENTRO
    //  de la misma transaccion de registrarEnsamblado. Asi el monto que queda
    //  escrito en el NFT es EXACTAMENTE el monto que se quemo, ni un mg mas.
    //
    //  La marca debe darle permiso previamente al contrato de Joyas con
    //  approve(joyasContract, cantidadMg) (estandar ERC-20), como si fuera un
    //  DEX gastando tokens en su nombre.
    // ----------------------------------------------------------------------
    function burnFrom(address cuenta, uint256 tokenIdPieza, uint256 cantidadMg) external {
        require(msg.sender == joyasContract, "Solo el contrato de Joyas puede quemar oro");
        _spendAllowance(cuenta, msg.sender, cantidadMg); // revierte si no alcanza el allowance
        _burn(cuenta, cantidadMg); // revierte si no alcanza el balance (ERC20: burn amount exceeds balance)
        emit OroConsumido(tokenIdPieza, cantidadMg, cuenta);
    }
}