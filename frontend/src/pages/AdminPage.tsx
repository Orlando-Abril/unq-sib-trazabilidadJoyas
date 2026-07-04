import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getReadContract, getReadOro, getWriteContract, getWriteOro } from "../services/contractService";
import { DEFAULT_ADMIN_ROLE, JOYAS_ADDRESS, ORO_ADDRESS } from "../config/contract";
import { ROLES } from "../config/roles";
import type { RoleKey } from "../config/roles";
import { useWallet } from "../hooks/useWallet";
import { useTransaction } from "../hooks/useTransaction";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { TxStatus } from "../components/ui/TxStatus";
import { Accordion } from "../components/ui/Accordion";

type ContratoKey = "joyas" | "oro";


const ROLES_POR_CONTRATO: Record<ContratoKey, RoleKey[]> = {
  joyas: ["MINERA", "TALLADO", "CERTIFICADORA", "MARCA", "JOYERIA"],
  oro: ["MINERA", "REFINERIA", "MARCA"],
};

export function AdminPage() {
  const { account } = useWallet();
  const [esAdminJoyas, setEsAdminJoyas] = useState(false);
  const [esAdminOro, setEsAdminOro] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      if (!account) {
        setEsAdminJoyas(false);
        setEsAdminOro(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const [joyas, oro] = await Promise.all([
          getReadContract().hasRole(DEFAULT_ADMIN_ROLE, account).catch(() => false),
          getReadOro().hasRole(DEFAULT_ADMIN_ROLE, account).catch(() => false),
        ]);
        setEsAdminJoyas(Boolean(joyas));
        setEsAdminOro(Boolean(oro));
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [account]);

  if (checking) return <p>Verificando permisos de administrador…</p>;
  if (!esAdminJoyas && !esAdminOro) {
    return (
      <div className="notice">
        <p>
          🚫 Tu wallet no tiene el rol de <strong>administrador</strong> en ninguno de los
          dos contratos.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div>
        <h2 className="page-title">⚙️ Panel de administrador</h2>
        <p className="page-subtitle">
          Sos admin en{" "}
          {esAdminJoyas && esAdminOro
            ? "los dos contratos (Joyas y Oro)"
            : esAdminJoyas
              ? "el contrato de Joyas"
              : "el contrato de Oro"}
          . Asignar rol.
        </p>
      </div>

      <Accordion
        title="Asignar rol"
        subtitle="Asignar rol a wallet"
        defaultOpen
      >
        <AsignarRolForm puedeJoyas={esAdminJoyas} puedeOro={esAdminOro} />
      </Accordion>

      <Accordion
        title="Revocar rol"
        subtitle="Sacar el rol a una wallet"
      >
        <RevocarRolForm puedeJoyas={esAdminJoyas} puedeOro={esAdminOro} />
      </Accordion>

      <Accordion
        title="Configurar contratos (registry)"
        subtitle="Conecta Joyas ↔ Oro."
      >
        <ConfigurarContratosForm puedeJoyas={esAdminJoyas} puedeOro={esAdminOro} />
      </Accordion>
    </div>
  );
}

function AsignarRolForm({ puedeJoyas, puedeOro }: { puedeJoyas: boolean; puedeOro: boolean }) {
  const { status, error, run } = useTransaction();
  const [contrato, setContrato] = useState<ContratoKey>(puedeJoyas ? "joyas" : "oro");
  const opcionesRol = ROLES_POR_CONTRATO[contrato];
  const [rol, setRol] = useState<RoleKey>(opcionesRol[0]);
  const [cuenta, setCuenta] = useState("");

  function cambiarContrato(nuevo: ContratoKey) {
    setContrato(nuevo);
    setRol(ROLES_POR_CONTRATO[nuevo][0]); // el rol elegido puede no existir en el otro contrato
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = contrato === "joyas" ? await getWriteContract() : await getWriteOro();
      const hash = ROLES[rol].hash;
      const tx = await contract.asignarRol(hash, cuenta);
      const receipt = await tx.wait();
      setCuenta("");
      return receipt;
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: "block", marginBottom: "1rem" }}>
        <span style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
          Contrato
        </span>
        <select
          value={contrato}
          onChange={(e) => cambiarContrato(e.target.value as ContratoKey)}
          style={{
            width: "100%",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
          }}
        >
          {puedeJoyas && <option value="joyas">Joyas (gema / pieza)</option>}
          {puedeOro && <option value="oro">Oro (ERC-20)</option>}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        <span style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Rol</span>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as RoleKey)}
          style={{
            width: "100%",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
          }}
        >
          {opcionesRol.map((r) => (
            <option key={r} value={r}>
              {ROLES[r].icon} {ROLES[r].label}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Wallet a la que se le asigna (0x...)"
        value={cuenta}
        onChange={(e) => setCuenta(e.target.value)}
        required
      />

      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Asignando…" : "Asignar rol"}
      </Button>
      <TxStatus status={status} error={error} successMessage="Rol asignado correctamente." />
    </form>
  );
}


function RevocarRolForm({ puedeJoyas, puedeOro }: { puedeJoyas: boolean; puedeOro: boolean }) {
  const { status, error, run } = useTransaction();
  const [contrato, setContrato] = useState<ContratoKey>(puedeJoyas ? "joyas" : "oro");
  const opcionesRol = ROLES_POR_CONTRATO[contrato];
  const [rol, setRol] = useState<RoleKey>(opcionesRol[0]);
  const [cuenta, setCuenta] = useState("");

  function cambiarContrato(nuevo: ContratoKey) {
    setContrato(nuevo);
    setRol(ROLES_POR_CONTRATO[nuevo][0]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await run(async () => {
      const contract = contrato === "joyas" ? await getWriteContract() : await getWriteOro();
      const hash = ROLES[rol].hash;
      const tx = await contract.revokeRole(hash, cuenta);
      const receipt = await tx.wait();
      setCuenta("");
      return receipt;
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ display: "block", marginBottom: "1rem" }}>
        <span style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>
          Contrato
        </span>
        <select
          value={contrato}
          onChange={(e) => cambiarContrato(e.target.value as ContratoKey)}
          style={{
            width: "100%",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
          }}
        >
          {puedeJoyas && <option value="joyas">Joyas (gema / pieza)</option>}
          {puedeOro && <option value="oro">Oro (ERC-20)</option>}
        </select>
      </label>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        <span style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Rol</span>
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as RoleKey)}
          style={{
            width: "100%",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
          }}
        >
          {opcionesRol.map((r) => (
            <option key={r} value={r}>
              {ROLES[r].icon} {ROLES[r].label}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Wallet a la que se le saca el rol (0x...)"
        value={cuenta}
        onChange={(e) => setCuenta(e.target.value)}
        required
      />

      <Button type="submit" disabled={status === "pending"}>
        {status === "pending" ? "Revocando…" : "Revocar rol"}
      </Button>
      <TxStatus status={status} error={error} successMessage="Rol revocado correctamente." />
    </form>
  );
}

function ConfigurarContratosForm({ puedeJoyas, puedeOro }: { puedeJoyas: boolean; puedeOro: boolean }) {
  const joyasTx = useTransaction();
  const oroTx = useTransaction();
  const [oroAddr, setOroAddr] = useState(ORO_ADDRESS);
  const [joyasAddr, setJoyasAddr] = useState(JOYAS_ADDRESS);

  async function guardarOroEnJoyas(e: FormEvent) {
    e.preventDefault();
    await joyasTx.run(async () => {
      const joyas = await getWriteContract();
      const tx = await joyas.setOroTokenContract(oroAddr);
      return tx.wait();
    });
  }

  async function guardarJoyasEnOro(e: FormEvent) {
    e.preventDefault();
    await oroTx.run(async () => {
      const oro = await getWriteOro();
      const tx = await oro.setJoyasContract(joyasAddr);
      return tx.wait();
    });
  }

  return (
    <div className="stack" style={{ gap: "1.5rem" }}>
      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
        Cada contrato guarda la dirección del otro para poder validar el oro que consume
        la Marca. Si el día de mañana se redeploya SOLO uno de los dos contratos, no hace
        falta redeployar el otro: alcanza con actualizar la dirección acá.
      </p>

      {puedeJoyas && (
        <form onSubmit={guardarOroEnJoyas}>
          <Input
            label="Dirección del contrato de Oro (se guarda en Joyas)"
            value={oroAddr}
            onChange={(e) => setOroAddr(e.target.value)}
            required
          />
          <Button type="submit" disabled={joyasTx.status === "pending"}>
            {joyasTx.status === "pending" ? "Guardando…" : "Guardar en contrato de Joyas"}
          </Button>
          <TxStatus
            status={joyasTx.status}
            error={joyasTx.error}
            successMessage="Contrato de Oro configurado en Joyas."
          />
        </form>
      )}

      {puedeOro && (
        <form onSubmit={guardarJoyasEnOro}>
          <Input
            label="Dirección del contrato de Joyas (se guarda en Oro)"
            value={joyasAddr}
            onChange={(e) => setJoyasAddr(e.target.value)}
            required
          />
          <Button type="submit" disabled={oroTx.status === "pending"}>
            {oroTx.status === "pending" ? "Guardando…" : "Guardar en contrato de Oro"}
          </Button>
          <TxStatus
            status={oroTx.status}
            error={oroTx.error}
            successMessage="Contrato de Joyas configurado en Oro."
          />
        </form>
      )}
    </div>
  );
}
