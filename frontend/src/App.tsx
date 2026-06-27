import { Routes, Route, Link } from "react-router-dom";
import { ConnectWallet } from "./components/ConnectWallet/ConnectWallet";
import { RoleGuard } from "./components/RoleGuard/RoleGuard";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ROLES } from "./config/roles";
import type { RoleKey } from "./config/roles";

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
                <ConnectWallet />
            </header>

            <main style={{ padding: "2rem" }}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    {(Object.keys(ROLES) as RoleKey[]).map((key) => (
                        <Route
                            key={key}
                            path={ROLES[key].path}
                            element={
                                <RoleGuard role={key}>
                                    <PlaceholderPage title={ROLES[key].label} />
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