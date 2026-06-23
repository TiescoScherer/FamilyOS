import { useState } from "react";

interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora?: string;
  tipo: "remedio" | "conta" | "compromisso" | "aniversario";
  membro?: string;
  cor: string;
}

const TIPO_CONFIG = {
  remedio:     { label: "Remédio",      cor: "#6C63FF", icon: "💊" },
  conta:       { label: "Conta",        cor: "#F59E0B", icon: "💳" },
  compromisso: { label: "Compromisso",  cor: "#06B6D4", icon: "📌" },
  aniversario: { label: "Aniversário",  cor: "#EC4899", icon: "🎂" },
};

const EVENTOS_MOCK: Evento[] = [
  { id: "1", titulo: "Aniversário Benjamin", data: "2026-07-01", tipo: "aniversario", cor: "#EC4899" },
  { id: "2", titulo: "Aniversário Dominic",  data: "2026-08-15", tipo: "aniversario", cor: "#EC4899" },
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export function CalendarPage() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth());
  const [eventos, setEventos] = useState<Evento[]>(EVENTOS_MOCK);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(hoje.getDate());
  const [modalAdd, setModalAdd] = useState(false);
  const [form, setForm] = useState({ titulo: "", hora: "", tipo: "compromisso" as Evento["tipo"], membro: "" });

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const eventosDoMes = eventos.filter(e => {
    const d = new Date(e.data);
    return d.getFullYear() === ano && d.getMonth() === mes;
  });

  const eventosPorDia = (dia: number) =>
    eventosDoMes.filter(e => new Date(e.data).getDate() === dia);

  const prevMes = () => { if (mes === 0) { setAno(a => a - 1); setMes(11); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 11) { setAno(a => a + 1); setMes(0); } else setMes(m => m + 1); };

  const handleAddEvento = () => {
    if (!form.titulo || !diaSelecionado) return;
    const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(diaSelecionado).padStart(2, "0")}`;
    const conf = TIPO_CONFIG[form.tipo];
    setEventos(prev => [...prev, {
      id: Date.now().toString(),
      titulo: form.titulo,
      data: dataStr,
      hora: form.hora || undefined,
      tipo: form.tipo,
      membro: form.membro || undefined,
      cor: conf.cor,
    }]);
    setForm({ titulo: "", hora: "", tipo: "compromisso", membro: "" });
    setModalAdd(false);
  };

  const eventosDiaSelecionado = diaSelecionado ? eventosPorDia(diaSelecionado) : [];

  return (
    <div style={sc.page}>
      <div style={sc.pageHeader}>
        <div>
          <h1 style={sc.pageTitle}>Calendário</h1>
          <p style={sc.pageDesc}>Compromissos, vencimentos e eventos da família</p>
        </div>
        {diaSelecionado && (
          <button onClick={() => setModalAdd(true)} style={sc.btnPrimary}>
            + Evento para dia {diaSelecionado}
          </button>
        )}
      </div>

      <div style={sc.layout}>
        {/* Calendário */}
        <div style={sc.calCard}>
          <div style={sc.calHeader}>
            <button onClick={prevMes} style={sc.navBtn}>‹</button>
            <span style={sc.calTitle}>{MESES[mes]} {ano}</span>
            <button onClick={nextMes} style={sc.navBtn}>›</button>
          </div>

          <div style={sc.daysHeader}>
            {DIAS_SEMANA.map(d => (
              <div key={d} style={sc.dayLabel}>{d}</div>
            ))}
          </div>

          <div style={sc.calGrid}>
            {Array.from({ length: primeiroDia }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: diasNoMes }).map((_, i) => {
              const dia = i + 1;
              const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
              const isSel = dia === diaSelecionado;
              const evs = eventosPorDia(dia);

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(dia)}
                  style={{
                    ...sc.dayCell,
                    background: isSel ? "var(--accent)" : isHoje ? "var(--accent-glow)" : "transparent",
                    color: isSel ? "#fff" : isHoje ? "var(--accent)" : "var(--text)",
                    fontWeight: isHoje || isSel ? 700 : 400,
                  }}
                >
                  {dia}
                  {evs.length > 0 && (
                    <div style={sc.dots}>
                      {evs.slice(0, 3).map(e => (
                        <div key={e.id} style={{ ...sc.dot, background: e.cor }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel lateral */}
        <div style={sc.sidePanel}>
          <p style={sc.sidePanelTitle}>
            {diaSelecionado
              ? `${diaSelecionado} de ${MESES[mes]}`
              : "Selecione um dia"}
          </p>
          {eventosDiaSelecionado.length === 0 && diaSelecionado && (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhum evento neste dia.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {eventosDiaSelecionado.map(e => {
              const conf = TIPO_CONFIG[e.tipo];
              return (
                <div key={e.id} style={{ ...sc.eventoCard, borderLeft: `3px solid ${e.cor}` }}>
                  <div style={sc.eventoIcon}>{conf.icon}</div>
                  <div>
                    <p style={sc.eventoTitulo}>{e.titulo}</p>
                    <p style={sc.eventoMeta}>
                      {e.hora && <span>{e.hora} · </span>}
                      <span style={{ color: e.cor }}>{conf.label}</span>
                      {e.membro && <span> · {e.membro}</span>}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Próximos eventos */}
          <div style={sc.proximosTitulo}>Próximos eventos</div>
          {eventos
            .filter(e => new Date(e.data) >= hoje)
            .sort((a, b) => a.data.localeCompare(b.data))
            .slice(0, 5)
            .map(e => {
              const conf = TIPO_CONFIG[e.tipo];
              const d = new Date(e.data + "T12:00");
              return (
                <div key={e.id} style={sc.proximoItem}>
                  <span style={{ ...sc.proximoBadge, background: e.cor + "22", color: e.cor }}>{conf.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{e.titulo}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal Adicionar Evento */}
      {modalAdd && (
        <div style={sc.overlay}>
          <div style={sc.modal} className="fade-in">
            <div style={sc.modalHeader}>
              <h2 style={sc.modalTitle}>Novo Evento — {diaSelecionado}/{mes + 1}/{ano}</h2>
              <button onClick={() => setModalAdd(false)} style={sc.closeBtn}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={sc.field}>
                <label style={sc.label}>Tipo</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Object.keys(TIPO_CONFIG) as Evento["tipo"][]).map(t => {
                    const conf = TIPO_CONFIG[t];
                    const sel = form.tipo === t;
                    return (
                      <button key={t} onClick={() => setForm(p => ({ ...p, tipo: t }))}
                        style={{
                          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: sel ? conf.cor + "33" : "var(--bg-hover)",
                          border: `1px solid ${sel ? conf.cor + "55" : "var(--border-light)"}`,
                          color: sel ? conf.cor : "var(--text-dim)",
                        }}>
                        {conf.icon} {conf.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={sc.field}>
                <label style={sc.label}>Título</label>
                <input style={sc.input} value={form.titulo}
                  onChange={(e) => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="Ex: Consulta pediatra, Reunião escola..." />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={sc.field}>
                  <label style={sc.label}>Horário (opcional)</label>
                  <input style={sc.input} type="time" value={form.hora}
                    onChange={(e) => setForm(p => ({ ...p, hora: e.target.value }))} />
                </div>
                <div style={sc.field}>
                  <label style={sc.label}>Membro (opcional)</label>
                  <select style={sc.input} value={form.membro}
                    onChange={(e) => setForm(p => ({ ...p, membro: e.target.value }))}>
                    <option value="">Família toda</option>
                    <option>Frantiesco</option>
                    <option>Maiara</option>
                    <option>Benjamin</option>
                    <option>Dominic</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={sc.modalFooter}>
              <button onClick={() => setModalAdd(false)} style={sc.cancelBtn}>Cancelar</button>
              <button onClick={handleAddEvento} style={sc.saveBtn}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sc: Record<string, React.CSSProperties> = {
  page: { padding: "28px 32px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 24 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "#fff" },
  pageDesc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" },

  calCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" },
  calHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  calTitle: { fontSize: 17, fontWeight: 700, color: "#fff" },
  navBtn: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, width: 32, height: 32, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  daysHeader: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 },
  dayLabel: { textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, padding: "4px 0", textTransform: "uppercase" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  dayCell: {
    position: "relative", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", transition: "background 0.15s",
  },
  dots: { display: "flex", gap: 2, position: "absolute", bottom: 3 },
  dot: { width: 4, height: 4, borderRadius: "50%" },

  sidePanel: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 12 },
  sidePanelTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  eventoCard: { background: "var(--bg-hover)", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" },
  eventoIcon: { fontSize: 18, flexShrink: 0 },
  eventoTitulo: { fontSize: 13, fontWeight: 600, color: "#fff" },
  eventoMeta: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  proximosTitulo: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, paddingTop: 8, borderTop: "1px solid var(--border)" },
  proximoItem: { display: "flex", alignItems: "center", gap: 10 },
  proximoBadge: { width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 },

  btnPrimary: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600 },
  overlay: { position: "fixed", inset: 0, background: "#00000088", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, width: "100%", maxWidth: 480, padding: 28, display: "flex", flexDirection: "column", gap: 20 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 20px", fontSize: 13 },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600 },
};
