import { useState } from "react";
import type { ReactNode } from "react";


export function Accordion({
  title,
  subtitle,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
          color: "inherit",
          font: "inherit",
        }}
      >
        <span>
          <span className="page-title" style={{ margin: 0, display: "block" }}>
            {icon ? `${icon} ` : ""}
            {title}
          </span>
          {subtitle && (
            <span className="page-subtitle" style={{ display: "block", margin: 0 }}>
              {subtitle}
            </span>
          )}
        </span>
        <span style={{ fontSize: "1.6rem", lineHeight: 1, opacity: 0.7 }}>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && <div style={{ marginTop: "1rem" }}>{children}</div>}
    </section>
  );
}
