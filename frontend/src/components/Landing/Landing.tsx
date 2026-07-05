import { Link } from "react-router-dom";
import { ConnectWallet } from "../ConnectWallet/ConnectWallet.tsx";
import "./Landing.css";

function Landing() {
    const traceSteps = [
        {
            title: "Minera",
            text: "Registra el origen del mineral o gema en bruto y crea el NFT inicial de la pieza.",
        },
        {
            title: "Refineria",
            text: "Carga el proceso de refinado del oro, su peso final y el porcentaje de pureza.",
        },
        {
            title: "Tallado",
            text: "Documenta el corte de la gema, los quilates y la cantidad de piezas obtenidas.",
        },
        {
            title: "Certificadora",
            text: "Agrega datos tecnicos como claridad, color, cut y numero de certificado.",
        },
        {
            title: "Marca",
            text: "Ensambla la joya final y vincula los materiales con su SKU y diseno.",
        },
        {
            title: "Joyeria",
            text: "Publica la pieza para retail, precio, estado de exhibicion y codigo QR.",
        },
        {
            title: "Cliente",
            text: "Puede verificar la historia completa de la joya antes o despues de comprarla.",
        },
    ];

    const benefits = [
        "Registros inmutables: los hitos no se editan ni se borran.",
        "Autoria verificable: cada actor firma con su propia wallet.",
        "Trazabilidad completa: desde la mina hasta el cliente final.",
        "Verificacion publica: cualquier persona puede consultar una pieza por QR.",
    ];

    const rolesInfo = [
        {
            name: "Minera Cooperativa",
            detail: "Inicia la trazabilidad y registra la extraccion del material.",
        },
        {
            name: "Refineria",
            detail: "Registra refinado, peso posterior y pureza del oro.",
        },
        {
            name: "Tallado",
            detail: "Carga informacion del corte, quilates y piezas obtenidas.",
        },
        {
            name: "Certificadora",
            detail: "Valida la gema con certificado, color, claridad y calidad.",
        },
        {
            name: "Marca / Fabricacion",
            detail: "Ensambla la joya y deja constancia del diseno final.",
        },
        {
            name: "Joyeria",
            detail: "Gestiona retail, exhibicion, precio y QR de consulta.",
        },
        {
            name: "Administrador",
            detail: "Asigna roles y configura contratos del sistema.",
        },
    ];

    const technologies = [
        "React",
        "TypeScript",
        "Vite",
        "Solidity",
        "Ethereum Sepolia",
        "ethers.js",
        "MetaMask",
        "ERC-721 NFT",
        "AccessControl",
        "IPFS",
    ];

    return (
        <div className="landing-page">
            <section className="landing-hero">
                <div className="landing-hero-copy">
                    <span className="landing-eyebrow">
                        Trabajo Final - Seminario de Blockchain 2026
                    </span>

                    <h1>Sistema Descentralizado de Trazabilidad de Joyas</h1>

                    <p>
                        Una plataforma para registrar la historia completa de una joya, desde la
                        extraccion del material hasta la venta final, usando blockchain, NFTs y
                        firmas por rol.
                    </p>

                    <div className="landing-actions">
                        <a href="#problema" className="landing-primary-action">
                            Conocer el proyecto
                        </a>

                        <Link to="/verificar" className="landing-secondary-action">
                            Verificar una pieza
                        </Link>
                    </div>

                    <div className="landing-proof-row" aria-label="Caracteristicas principales">
                        <span>NFT ERC-721</span>
                        <span>Red Sepolia</span>
                        <span>Firma con MetaMask</span>
                        <span>QR publico</span>
                    </div>
                </div>

                <div className="landing-hero-visual" aria-label="Vista conceptual de una joya trazable">
                    <div className="landing-orbit">
                        <span>01</span>
                        <span>07</span>
                    </div>

                    <img src="/anillo.png" alt="Anillo representando una joya trazable" />

                    <div className="landing-chain-card">
                        <span>Token unico ERC-721</span>
                        <strong>Historia verificable</strong>
                        <small>Hitos firmados por cada actor de la cadena</small>
                    </div>
                </div>
            </section>

            <section id="problema" className="landing-section">
                <div className="landing-section-heading">
                    <span>Problema</span>
                    <h2>La trazabilidad tradicional depende demasiado de la confianza.</h2>
                    <p>
                        En una cadena de valor con varios intermediarios, los registros en
                        papel o sistemas privados pueden ser incompletos, dificiles de
                        auditar o directamente falsificables.
                    </p>
                </div>

                <div className="landing-comparison">
                    <article>
                        <h3>Hoy</h3>
                        <ul>
                            <li>La informacion queda fragmentada entre actores.</li>
                            <li>Los certificados pueden circular separados de la pieza.</li>
                            <li>Es dificil comprobar origen, autenticidad y recorrido.</li>
                            <li>El cliente final depende de lo que le informe el vendedor.</li>
                        </ul>
                    </article>

                    <article>
                        <h3>Con esta solucion</h3>
                        <ul>
                            {benefits.map((benefit) => (
                                <li key={benefit}>{benefit}</li>
                            ))}
                        </ul>
                    </article>
                </div>
            </section>

            <section id="flujo" className="landing-section landing-flow-section">
                <div className="landing-section-heading">
                    <span>Flujo</span>
                    <h2>Una joya, una historia, siete hitos verificables.</h2>
                    <p>
                        Cada etapa se registra en orden. El contrato inteligente evita
                        saltear pasos o modificar informacion ya escrita.
                    </p>
                </div>

                <div className="landing-flow">
                    {traceSteps.map((step, index) => (
                        <article key={step.title} className="landing-step-card">
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="roles" className="landing-section">
                <div className="landing-section-heading">
                    <span>Roles</span>
                    <h2>Cada usuario ve solo el panel que le corresponde.</h2>
                    <p>
                        Al conectar MetaMask, la aplicacion consulta on-chain los roles de
                        la wallet y habilita los formularios adecuados.
                    </p>
                </div>

                <div className="landing-role-grid">
                    {rolesInfo.map((role) => (
                        <article key={role.name}>
                            <h3>{role.name}</h3>
                            <p>{role.detail}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="arquitectura" className="landing-section landing-architecture">
                <div className="landing-section-heading">
                    <span>Arquitectura</span>
                    <h2>Frontend, wallet y contrato inteligente trabajando juntos.</h2>
                    <p>
                        La app no depende de un servidor central para validar la historia de
                        la pieza. Los datos principales viven en blockchain y los documentos
                        pesados pueden referenciarse mediante IPFS.
                    </p>
                </div>

                <div className="landing-architecture-grid">
                    <article>
                        <h3>Frontend</h3>
                        <p>
                            React + TypeScript muestran formularios por rol, estados de
                            transaccion y paginas publicas de verificacion.
                        </p>
                    </article>

                    <article>
                        <h3>Wallet</h3>
                        <p>
                            MetaMask identifica al usuario, firma operaciones y confirma cada
                            registro enviado a la red Sepolia.
                        </p>
                    </article>

                    <article>
                        <h3>Smart Contract</h3>
                        <p>
                            Solidity define roles, etapas, permisos, NFT ERC-721 y reglas de
                            inmutabilidad para cada hito.
                        </p>
                    </article>

                    <article>
                        <h3>Verificacion</h3>
                        <p>
                            Cualquier persona puede consultar una pieza desde un QR o tokenId,
                            sin necesitar permisos especiales.
                        </p>
                    </article>
                </div>
            </section>

            <section id="tecnologias" className="landing-section">
                <div className="landing-section-heading">
                    <span>Tecnologias</span>
                    <h2>Stack usado en el proyecto.</h2>
                </div>

                <div className="landing-tech-list">
                    {technologies.map((tech) => (
                        <span key={tech}>{tech}</span>
                    ))}
                </div>
            </section>

            <section className="landing-section landing-final-cta">
                <h2>Acceso al sistema</h2>
                <p>
                    Si sos parte de la cadena, conecta tu wallet para ingresar al panel de
                    tu rol. Si solo queres consultar una joya, podes usar la verificacion
                    publica.
                </p>

                <div className="landing-actions">
                    <ConnectWallet />
                    <Link to="/verificar" className="landing-secondary-action">
                        Ir a verificacion publica
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Landing;
