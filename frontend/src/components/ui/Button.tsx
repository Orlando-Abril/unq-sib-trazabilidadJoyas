import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

// Botón reutilizable. Acepta todas las props nativas de <button> (onClick, disabled, type…).
export function Button({ children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={styles.button} {...rest}>
      {children}
    </button>
  );
}
