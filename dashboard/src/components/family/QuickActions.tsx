interface Action {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
}

interface Props {
  onAddDespesa: () => void;
  onAddReceita: () => void;
  onAddRemedio: () => void;
  onAddCompra: () => void;
  onAddMeta: () => void;
}

export function QuickActions({ onAddDespesa, onAddReceita, onAddRemedio, onAddCompra, onAddMeta }: Props) {
  const actions: Action[] = [
    { label: "Adicionar Despesa", icon: "💸", color: "#EF4444", onClick: onAddDespesa },
    { label: "Registrar Receita", icon: "💰", color: "#22C55E", onClick: onAddReceita },
    { label: "Registrar Remédio", icon: "💊", color: "#6C63FF", onClick: onAddRemedio },
    { label: "Lista de Compras", icon: "🛒", color: "#F59E0B", onClick: onAddCompra },
    { label: "Nova Meta", icon: "🎯", color: "#06B6D4", onClick: onAddMeta },
  ];

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Acesso Rápido</h2>
      <div style={styles.grid}>
        {actions.map((a) => (
          <button key={a.label} style={{ ...styles.btn, borderColor: a.color + "44" }} onClick={a.onClick}>
            <span style={{ ...styles.btnIcon, background: a.color + "22", color: a.color }}>
              {a.icon}
            </span>
            <span style={styles.btnLabel}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "var(--bg-sidebar, #1a1a2e)",
    border: "1px solid var(--border, #2d2d44)",
    borderRadius: 12,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    background: "transparent",
    border: "1px solid",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background 0.15s",
    textAlign: "left",
  },
  btnIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    flexShrink: 0,
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ddd",
    lineHeight: 1.3,
  },
};
