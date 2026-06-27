import { ConnectWallet } from "./components/ConnectWallet/ConnectWallet";

function App() {
    return (
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
            <h1>Trazabilidad de Joyas 💎</h1>
            <ConnectWallet />
        </header>
    );
}

export default App;