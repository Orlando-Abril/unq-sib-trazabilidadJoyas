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
import { ROLES } from "./config/roles";
import type { RoleKey } from "./config/roles";

// Mapa de rol -> página real.
const PAGES: Partial<Record<RoleKey, ReactNode>> = {
  MINERA: <MineraPage />,
  REFINERIA: <RefineriaPage />,
  TALLADO: <TalladoPage />,
  CERTIFICADORA: <CertificadoraPage />,
  MARCA: <MarcaPage />,
  JOYERIA: <JoyeriaPage />,
};

function App() {
    return (
        <>
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 2rem",
                    background: "white",
                    borderBottom: "1px solid #eee",
                }}
            >
                <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                    <h1>Trazabilidad de Joyas 💎</h1>
                </Link>
                <nav style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <Link to="/verificar" style={{ color: "#6c5ce7", fontWeight: 600 }}>
                        Verificar pieza
                    </Link>
                    <ConnectWallet />
                </nav>
            </header>

            <main style={{ padding: "2rem" }}>
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