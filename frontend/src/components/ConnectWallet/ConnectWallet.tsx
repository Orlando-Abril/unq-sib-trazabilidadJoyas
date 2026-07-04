import { useWallet } from "../../hooks/useWallet";
import styles from "./ConnectWallet.module.css";

function short(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
    const { account, isConnected, isCorrectNetwork, connect, switchToSepolia } = useWallet();

    if (!isConnected) {
        return (
            <button className={styles.button} onClick={connect}>
                Conectar MetaMask
            </button>
        );
    }

    if (!isCorrectNetwork) {
        return (
            <button className={styles.warning} onClick={switchToSepolia}>
                ⚠️ Cambiar a Sepolia
            </button>
        );
    }

    return <span className={styles.account}>🟢 {short(account!)}</span>;
}