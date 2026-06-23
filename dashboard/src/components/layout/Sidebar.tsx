import { useNavStore, type Page } from "@/store/useNavStore";

interface NavItem {
  id: Page;
  label: string;
  icon: string;
  badge?: number;
}

const NAV: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",      icon: "⬡" },
  { id: "familia",    label: "Família",         icon: "👨‍👩‍👦" },
  { id: "financeiro", label: "Financeiro",      icon: "💳" },
  { id: "calendario", label: "Calendário",      icon: "📅" },
  { id: "saude",      label: "Saúde",           icon: "💊" },
  { id: "compras",    label: "Lista de Compras",icon: "🛒" },
  { id: "metas",      label: "Metas",           icon: "🎯" },
];

export function Sidebar() {
  const { page, go } = useNavStore();

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logo}>
        <div style={s.logoIcon}>F</div>
        <div>
          <div style={s.logoTitle}>Family OS</div>
          <div style={s.logoSub}>Centro de Comando</div>
        </div>
      </div>

      <div style={s.divider} />

      {/* Nav items */}
      <nav style={s.nav}>
        {NAV.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              style={{
                ...s.item,
                background: active ? "var(--accent-glow)" : "transparent",
                borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                color: active ? "#fff" : "var(--text-dim)",
              }}
            >
              <span style={s.itemIcon}>{item.icon}</span>
              <span style={s.itemLabel}>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span style={s.badge}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerDot} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Conectado</span>
      </div>
    </aside>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: "var(--sidebar-w)",
    minWidth: "var(--sidebar-w)",
    height: "100%",
    background: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "0",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 20px 18px",
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: "var(--accent)",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
    color: "#fff",
    flexShrink: 0,
  },
  logoTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  logoSub: { fontSize: 11, color: "var(--text-muted)", marginTop: 1 },
  divider: { height: 1, background: "var(--border)", margin: "0 16px 8px" },
  nav: { display: "flex", flexDirection: "column", gap: 2, padding: "4px 10px", flex: 1 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    width: "100%",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 500,
    transition: "background 0.15s, color 0.15s",
    cursor: "pointer",
  },
  itemIcon: { fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 },
  itemLabel: { flex: 1 },
  badge: {
    background: "var(--accent)",
    color: "#fff",
    borderRadius: 99,
    fontSize: 10,
    fontWeight: 700,
    padding: "1px 6px",
    minWidth: 18,
    textAlign: "center",
  },
  footer: {
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderTop: "1px solid var(--border)",
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "var(--green)",
    boxShadow: "0 0 6px var(--green)",
  },
};
