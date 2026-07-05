import type { ReactNode } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { ConnectWallet } from "./components/ConnectWallet/ConnectWallet";
import { RoleGuard } from "./components/RoleGuard/RoleGuard";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { MineraPage } from "./pages/MineraPage";
import { RefineriaPage } from "./pages/RefineriaPage";
import { TalladoPage } from "./pages/TalladoPage";
import { CertificadoraPage } from "./pages/CertificadoraPage";
import { MarcaPage } from "./pages/MarcaPage";
import { JoyeriaPage } from "./pages/JoyeriaPage";
import { VerificarPage } from "./pages/VerificarPage";
import { AdminPage } from "./pages/AdminPage";
import { useWallet } from "./hooks/useWallet";
import { useRole } from "./hooks/useRole";
import { ROLES } from "./config/roles";
import type { RoleKey } from "./config/roles";
import Landing from "./components/Landing/Landing.tsx";

const PAGES: Partial<Record<RoleKey, ReactNode>> = {
    MINERA: <MineraPage />,
    REFINERIA: <RefineriaPage />,
    TALLADO: <TalladoPage />,
    CERTIFICADORA: <CertificadoraPage />,
    MARCA: <MarcaPage />,
    JOYERIA: <JoyeriaPage />,
    ADMIN: <AdminPage />,
};


function ConnectedHomePage() {
    const { isConnected, isCorrectNetwork } = useWallet();
    const { roles, loading } = useRole();

    if (!isConnected) return <Landing />;

    if (!isCorrectNetwork) {
        return (
            <div className="notice">
                <p>
                    Cambiá a la red <strong>Sepolia</strong> para continuar.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="notice">
                <p>Detectando tu rol on-chain...</p>
            </div>
        );
    }

    if (roles.length === 0) {
        return (
            <div className="notice">
                <p>
                    Tu wallet no tiene ningun <strong>rol asignado</strong>. Pedile al
                    administrador que te asigne uno.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="hero">
                <h2>Tus accesos</h2>
                <p>Elegí la etapa de la cadena que querés registrar.</p>
            </div>

            <div className="role-grid">
                {roles.map((role) => (
                    <Link key={role} to={ROLES[role].path} className="role-card">
                        <span className="role-icon">{ROLES[role].icon}</span>
                        <span className="role-name">{ROLES[role].label}</span>
                        <span className="role-cta">Ingresar →</span>
                    </Link>
                ))}
            </div>
        </>
    );
}

function App() {
    return (
        <>
            <header className="app-header">
                <Link to="/" className="brand">
                    Trazabilidad de Joyas
                </Link>

                <nav className="app-nav">
                    <Link to="/verificar" className="nav-link">
                        Verificar pieza
                    </Link>

                    <ConnectWallet />
                </nav>
            </header>

            <main className="container">
                <Routes>
                    <Route path="/" element={<ConnectedHomePage />} />
                    <Route path="/verificar" element={<VerificarPage />} />
                    <Route path="/verificar/:tokenId" element={<VerificarPage />} />

                    {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                        <Route
                            key={key}
                            path={ROLES[key].path}
                            element={
                                <RoleGuard role={key}>
                                    {PAGES[key] ?? <PlaceholderPage title={ROLES[key].label} />}
                                </RoleGuard>
                            }
                        />
                    ))}
                </Routes>
            </main>
        </>
    );
}


export default App;