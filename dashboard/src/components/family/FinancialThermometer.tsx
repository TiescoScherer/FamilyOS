import type { FutureGoal } from "@/types/family";

interface Props {
  goals: FutureGoal[];
  receitas: number;
  despesas: number;
}

function GoalBar({ goal }: { goal: FutureGoal }) {
  const pct = Math.min(100, Math.round((goal.valor_atual / goal.valor_alvo) * 100));
  const color = pct >= 100 ? "#22C55E" : pct >= 50 ? "#6C63FF" : "#F59E0B";

  return (
    <div style={styles.goalItem}>
      <div style={styles.goalHeader}>
        <span style={styles.goalTitle}>{goal.titulo}</span>
        <span style={{ ...styles.goalPct, color }}>{pct}%</span>
      </div>
      <div style={styles.track}>
        <div style={{ ...styles.fill, width: `${pct}%`, background: color }} />
      </div>
      <div style={styles.goalValues}>
        <span>R$ {goal.valor_atual.toLocaleString("pt-BR")}</span>
        <span style={{ color: "#666" }}>/ R$ {goal.valor_alvo.toLocaleString("pt-BR")}</span>
      </div>
    </div>
  );
}

export function FinancialThermometer({ goals, receitas, despesas }: Props) {
  const saldo = receitas - despesas;
  const saldoColor = saldo >= 0 ? "#22C55E" : "#EF4444";

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Termômetro Financeiro</h2>

      <div style={styles.summary}>
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Receitas</span>
          <span style={{ ...styles.summaryValue, color: "#22C55E" }}>
            R$ {receitas.toLocaleString("pt-BR")}
          </span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Despesas</span>
          <span style={{ ...styles.summaryValue, color: "#EF4444" }}>
            R$ {despesas.toLocaleString("pt-BR")}
          </span>
        </div>
        <div style={styles.divider} />
        <div style={styles.summaryItem}>
          <span style={styles.summaryLabel}>Saldo</span>
          <span style={{ ...styles.summaryValue, color: saldoColor }}>
            R$ {saldo.toLocaleString("pt-BR")}
          </span>
        </div>
      </div>

      {goals.length > 0 && (
        <>
          <p style={styles.goalsTitle}>Metas em Andamento</p>
          <div style={styles.goalsList}>
            {goals.filter(g => g.status === "em_andamento").map(g => (
              <GoalBar key={g.id} goal={g} />
            ))}
          </div>
        </>
      )}
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
  summary: { display: "flex", alignItems: "center", gap: 16 },
  summaryItem: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  summaryLabel: { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryValue: { fontSize: 18, fontWeight: 700 },
  divider: { width: 1, height: 32, background: "#2d2d44" },
  goalsTitle: { margin: 0, fontSize: 13, color: "#888", fontWeight: 600 },
  goalsList: { display: "flex", flexDirection: "column", gap: 14 },
  goalItem: { display: "flex", flexDirection: "column", gap: 4 },
  goalHeader: { display: "flex", justifyContent: "space-between" },
  goalTitle: { fontSize: 13, color: "#ccc" },
  goalPct: { fontSize: 13, fontWeight: 700 },
  track: { height: 6, background: "#2d2d44", borderRadius: 99 },
  fill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  goalValues: { display: "flex", gap: 4, fontSize: 11, color: "#aaa" },
};
