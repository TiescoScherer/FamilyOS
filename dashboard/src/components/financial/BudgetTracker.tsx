import { useState } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import type { BudgetCategory } from "@/types/financial";

function BudgetBar({ b, onEdit }: { b: BudgetCategory; onEdit: (b: BudgetCategory) => void }) {
  const pct = b.limite > 0 ? Math.min(100, (b.gasto / b.limite) * 100) : 0;
  const restante = b.limite - b.gasto;
  const barCor = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : b.cor;
  const statusLabel = pct >= 90 ? "Crítico" : pct >= 70 ? "Atenção" : "OK";
  const statusCor   = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : "#22C55E";

  return (
    <div style={bs.row} onClick={() => onEdit(b)}>
      <div style={{ ...bs.icon, background: b.cor + "22" }}>{b.icon}</div>

      <div style={bs.info}>
        <div style={bs.infoTop}>
          <span style={bs.catNome}>{b.nome}</span>
          <span style={{ ...bs.statusTag, background: statusCor + "18", color: statusCor }}>{statusLabel}</span>
        </div>
        <div style={bs.barTrack}>
          <div style={{ ...bs.barFill, width: `${pct}%`, background: barCor }} />
        </div>
        <div style={bs.infoBot}>
          <span style={bs.spent}>R$ {b.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span style={bs.rest}>
            {restante >= 0
              ? `Restam R$ ${restante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : <span style={{ color: "#EF4444" }}>Excedido R$ {Math.abs(restante).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            }
          </span>
          <span style={bs.pct}>{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

function EditBudgetModal({ b, onClose }: { b: BudgetCategory; onClose: () => void }) {
  const { updateBudget } = useFinancialStore();
  const [limite, setLimite] = useState(String(b.limite));

  return (
    <div style={bs.overlay}>
      <div style={bs.modal} className="fade-in">
        <div style={bs.mHeader}>
          <h2 style={bs.mTitle}>{b.icon} {b.nome}</h2>
          <button onClick={onClose} style={bs.closeBtn}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={bs.label}>Limite mensal (R$)</label>
          <input style={bs.input} type="number" value={limite}
            onChange={e => setLimite(e.target.value)} placeholder="0,00" autoFocus />
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Gasto atual: R$ {b.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div style={bs.mFooter}>
          <button onClick={onClose} style={bs.cancelBtn}>Cancelar</button>
          <button onClick={() => { updateBudget({ ...b, limite: parseFloat(limite) || b.limite }); onClose(); }}
            style={{ ...bs.saveBtn, background: b.cor }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export function BudgetTracker() {
  const { budgets } = useFinancialStore();
  const [editing, setEditing] = useState<BudgetCategory | null>(null);

  const totalGasto  = budgets.reduce((s, b) => s + b.gasto, 0);
  const totalLimite = budgets.reduce((s, b) => s + b.limite, 0);
  const pctGeral    = totalLimite > 0 ? Math.min(100, (totalGasto / totalLimite) * 100) : 0;
  const alertas     = budgets.filter(b => b.limite > 0 && b.gasto / b.limite >= 0.8).length;

  return (
    <div style={bs.root}>
      {/* Cabeçalho com termômetro geral */}
      <div style={bs.header}>
        <div style={bs.headerLeft}>
          <p style={bs.title}>Orçamento do Mês</p>
          <p style={bs.sub}>Clique em uma categoria para ajustar o limite</p>
        </div>
        {alertas > 0 && (
          <span style={bs.alertBadge}>⚠ {alertas} categoria{alertas > 1 ? "s" : ""} em alerta</span>
        )}
      </div>

      {/* Termômetro geral */}
      <div style={bs.geral}>
        <div style={bs.geralRow}>
          <span style={bs.geralLabel}>Total gasto</span>
          <span style={bs.geralVal}>
            R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              {" "}/ R$ {totalLimite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </span>
        </div>
        <div style={{ ...bs.barTrack, height: 10 }}>
          <div style={{ ...bs.barFill, height: "100%", width: `${pctGeral}%`,
            background: pctGeral >= 90 ? "#EF4444" : pctGeral >= 70 ? "#F59E0B" : "#6C63FF" }} />
        </div>
      </div>

      {/* Categorias */}
      <div style={bs.list}>
        {budgets.map(b => <BudgetBar key={b.id} b={b} onEdit={setEditing} />)}
      </div>

      {editing && <EditBudgetModal b={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const bs: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 16 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: {},
  title: { fontSize: 16, fontWeight: 700, color: "#fff" },
  sub: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  alertBadge: { background: "#F59E0B18", color: "#F59E0B", border: "1px solid #F59E0B33", borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 },
  geral: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 },
  geralRow: { display: "flex", justifyContent: "space-between" },
  geralLabel: { fontSize: 12, color: "var(--text-muted)" },
  geralVal: { fontSize: 15, fontWeight: 700, color: "#fff" },
  list: { display: "flex", flexDirection: "column", gap: 4 },
  row: { display: "flex", gap: 14, alignItems: "center", padding: "12px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", background: "var(--bg-card)", border: "1px solid var(--border)" },
  icon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
  infoTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  catNome: { fontSize: 13, fontWeight: 600, color: "#fff" },
  statusTag: { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.3 },
  barTrack: { height: 5, background: "#ffffff12", borderRadius: 99 },
  barFill: { borderRadius: 99, transition: "width 0.4s ease" },
  infoBot: { display: "flex", gap: 8, alignItems: "center" },
  spent: { fontSize: 12, fontWeight: 600, color: "#fff" },
  rest: { fontSize: 11, color: "var(--text-muted)", flex: 1 },
  pct: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },
  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 14, width: "100%", maxWidth: 360, overflow: "hidden" },
  mHeader: { padding: "18px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" },
  mTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  label: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 15, outline: "none", width: "100%" },
  mFooter: { padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" },
  saveBtn: { border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
