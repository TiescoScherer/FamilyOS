import type { TimelineEvent } from "@/types/family";

const COLORS = {
  remedio: "#6C63FF",
  meta: "#22C55E",
  compra: "#F59E0B",
};

const ICONS = {
  remedio: "💊",
  meta: "🎯",
  compra: "🛒",
};

interface Props {
  events: TimelineEvent[];
}

export function TimelineWidget({ events }: Props) {
  const now = new Date();
  const currentHour = now.getHours() * 60 + now.getMinutes();

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Timeline do Dia</h2>
      <p style={styles.subtitle}>{now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>

      <div style={styles.list}>
        {events.length === 0 && (
          <p style={styles.empty}>Nenhum evento hoje.</p>
        )}
        {events.map((ev, i) => {
          const [h, m] = ev.hora.split(":").map(Number);
          const evMinutes = h * 60 + m;
          const isPast = evMinutes < currentHour;

          return (
            <div key={i} style={{ ...styles.event, opacity: isPast ? 0.45 : 1 }}>
              <div style={{ ...styles.dot, background: COLORS[ev.tipo] }}>
                {ICONS[ev.tipo]}
              </div>
              <div style={styles.eventInfo}>
                <span style={styles.eventTime}>{ev.hora}</span>
                <span style={styles.eventTitle}>{ev.titulo}</span>
                <span style={styles.eventSub}>{ev.subtitulo}</span>
              </div>
              {ev.urgente && <span style={styles.badge}>urgente</span>}
            </div>
          );
        })}
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
    gap: 8,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" },
  subtitle: { margin: 0, fontSize: 12, color: "#888" },
  list: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  empty: { color: "#666", fontSize: 13 },
  event: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #222",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
  eventInfo: { display: "flex", flexDirection: "column", flex: 1, gap: 2 },
  eventTime: { fontSize: 11, color: "#888" },
  eventTitle: { fontSize: 14, fontWeight: 600, color: "#fff" },
  eventSub: { fontSize: 12, color: "#aaa" },
  badge: {
    background: "#F59E0B22",
    color: "#F59E0B",
    border: "1px solid #F59E0B44",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
  },
};
