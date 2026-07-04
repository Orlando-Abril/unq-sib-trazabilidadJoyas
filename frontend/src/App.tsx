import type { ReactNode } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { ConnectWallet } from "./components/ConnectWallet/ConnectWallet";
import { RoleGuard } from "./components/RoleGuard/RoleGuard";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { MineraPage } from "./pages/MineraPage";
import { RefineriaPage } from "./pages/RefineriaPage";
import { TalladoPage } from "./pages/TalladoPage";
import { CertificadoraPage } from "./pages/CertificadoraPage";
import { MarcaPage } from "./pages/MarcaPage";
import { JoyeriaPage } from "./pages/JoyeriaPage";
import { VerificarPage } from "./pages/VerificarPage";
import { AdminPage } from "./pages/AdminPage";
import { ROLES } from "./config/roles";
import type { RoleKey } from "./config/roles";

const PAGES: Partial<Record<RoleKey, ReactNode>> = {
  MINERA: <MineraPage />,
  REFINERIA: <RefineriaPage />,
  TALLADO: <TalladoPage />,
  CERTIFICADORA: <CertificadoraPage />,
  MARCA: <MarcaPage />,
  JOYERIA: <JoyeriaPage />,
  ADMIN: <AdminPage />,
};

function App() {
    return (
        <>
            <header className="app-header">
                <Link to="/" className="brand">
                    💎 Trazabilidad de Joyas
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
                    <Route path="/" element={<HomePage />} />
                    {/* Rutas públicas de verificación (sin wallet ni rol) */}
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