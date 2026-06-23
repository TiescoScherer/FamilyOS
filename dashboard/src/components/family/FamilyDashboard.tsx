import { useFamilyStore } from "@/store/useFamilyStore";
import { TimelineWidget } from "./TimelineWidget";
import { FinancialThermometer } from "./FinancialThermometer";
import { QuickActions } from "./QuickActions";
import type { TimelineEvent } from "@/types/family";

function buildTimeline(medications: ReturnType<typeof useFamilyStore.getState>["medications"]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const hoje = new Date();

  for (const med of medications) {
    if (!med.status_ativo) continue;
    const [startH, startM] = med.horario_inicio.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const totalMinutes = 24 * 60;

    let current = startMinutes;
    while (current < totalMinutes) {
      const h = Math.floor(current / 60).toString().padStart(2, "0");
      const m = (current % 60).toString().padStart(2, "0");
      events.push({
        hora: `${h}:${m}`,
        titulo: `${med.nome_remedio} — ${med.member_nome ?? "filho"}`,
        subtitulo: med.dosagem,
        tipo: "remedio",
      });
      current += med.frequencia_horas * 60;
    }
  }

  return events.sort((a, b) => a.hora.localeCompare(b.hora));
}

export function FamilyDashboard() {
  const { medications, financials, goals, shopping } = useFamilyStore();

  const receitas = financials
    .filter(f => f.tipo === "receita" && f.data.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, f) => s + f.valor, 0);

  const despesas = financials
    .filter(f => f.tipo === "despesa" && f.data.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, f) => s + f.valor, 0);

  const timelineEvents = buildTimeline(medications);

  const urgentes = shopping.filter(s => !s.comprado && s.urgente).length;

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Family OS</h1>
          <p style={styles.headerSub}>Centro de Comando — {new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        {urgentes > 0 && (
          <div style={styles.alert}>
            🛒 {urgentes} item{urgentes > 1 ? "s" : ""} urgente{urgentes > 1 ? "s" : ""}
          </div>
        )}
      </header>

      <div style={styles.grid}>
        <div style={styles.colLeft}>
          <TimelineWidget events={timelineEvents} />
          <QuickActions
            onAddDespesa={() => alert("Em breve: formulário de despesa")}
            onAddReceita={() => alert("Em breve: formulário de receita")}
            onAddRemedio={() => alert("Em breve: formulário de remédio")}
            onAddCompra={() => alert("Em breve: lista de compras")}
            onAddMeta={() => alert("Em breve: nova meta")}
          />
        </div>
        <div style={styles.colRight}>
          <FinancialThermometer
            goals={goals}
            receitas={receitas}
            despesas={despesas}
          />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    width: "100%",
    height: "100%",
    overflowY: "auto",
    padding: "24px 32px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    background: "var(--bg, #0f0f1a)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#fff" },
  headerSub: { margin: "4px 0 0", fontSize: 13, color: "#888" },
  alert: {
    background: "#F59E0B22",
    color: "#F59E0B",
    border: "1px solid #F59E0B44",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    alignItems: "start",
  },
  colLeft: { display: "flex", flexDirection: "column", gap: 20 },
  colRight: { display: "flex", flexDirection: "column", gap: 20 },
};
