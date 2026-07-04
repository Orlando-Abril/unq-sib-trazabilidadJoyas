// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin v5 (Remix los baja solo).
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

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
        uint256 pesoBrutoMg;
        // --- datos que agrega la refineria ---
        bool    refinado;
        string  metodo;
        uint256 pesoPostMg;
        uint16  leyMilesimas;
        // --- firmas / tiempos ---
        address minera;
        address refineria;
        uint256 timestampExtraccion;
        uint256 timestampRefinado;
    }

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
    //  HITO 2 (ORO) — REFINADO (Refineria).
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
    // ----------------------------------------------------------------------
    address public joyasContract;

    function setJoyasContract(address _joyas) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_joyas != address(0), "Direccion invalida");
        joyasContract = _joyas;
    }

    // ----------------------------------------------------------------------
    function burnFrom(address cuenta, uint256 tokenIdPieza, uint256 cantidadMg) external {
        require(msg.sender == joyasContract, "Solo el contrato de Joyas puede quemar oro");
        _spendAllowance(cuenta, msg.sender, cantidadMg);
        _burn(cuenta, cantidadMg);
        emit OroConsumido(tokenIdPieza, cantidadMg, cuenta);
    }
}