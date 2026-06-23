import { useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";

interface MedHoje { nome: string; hora: string; dosagem: string; }
interface Vacina  { nome: string; data: string; }

interface Member {
  id: string;
  nome: string;
  role: "admin" | "filho";
  dataNascimento: string;
  emoji: string;
  cor: string;
  // Saúde geral
  tipoSanguineo: string;
  alergias: string[];
  peso: string;
  altura: string;
  ultimaConsulta: string;
  cirurgias: string;
  // Documentos
  cpf: string;
  rg: string;
  certidao: string;
  // Convênio
  convenio: string;
  carteirinha: string;
  // Contato emergência
  contatoEmergencia: string;
  contatoTelefone: string;
  // Filhos
  pediatra: string;
  pediatraTel: string;
  proximaVacina: Vacina;
  medicamentosHoje: MedHoje[];
  escola: string;
  serie: string;
  professora: string;
  horarioEscola: string;
  telEscola: string;
}





function calcIdade(d: string) {
  const n = new Date(d); const h = new Date();
  let a = h.getFullYear() - n.getFullYear();
  if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) a--;
  return a;
}

function maskCPF(v: string) {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length < 4) return v;
  return `${d.slice(0,3)}.***.***.${d.slice(-2)}`;
}

// ── CAMADA 1+2+3: Card principal ──────────────────────────
function MemberCard({ m, onEdit }: { m: Member; onEdit: () => void }) {
  const idade = calcIdade(m.dataNascimento);
  const isFilho = m.role === "filho";
  const hoje = new Date().toISOString().slice(0, 10);
  const vacFutura = m.proximaVacina?.data && m.proximaVacina.data > hoje ? m.proximaVacina : null;
  const diasVac = vacFutura
    ? Math.ceil((new Date(vacFutura.data).getTime() - new Date().getTime()) / 86400000)
    : null;

  return (
    <div style={{ ...cs.card, "--cor": m.cor } as React.CSSProperties}>

      {/* ── CAMADA 1: Topo — identidade + tipo sanguíneo + alergias ── */}
      <div style={{ ...cs.cardTop, background: m.cor + "18", borderBottom: `1px solid ${m.cor}33` }}>
        <div style={cs.topRow}>
          <div style={{ ...cs.avatar, background: m.cor + "25", border: `2px solid ${m.cor}55` }}>
            <span style={{ fontSize: 34 }}>{m.emoji}</span>
          </div>
          <div style={cs.topInfo}>
            <div style={cs.topName}>{m.nome}</div>
            <div style={cs.topMeta}>
              <span style={{ ...cs.badge, background: isFilho ? "#06B6D422" : "#6C63FF22", color: isFilho ? "#06B6D4" : "#6C63FF", border: `1px solid ${isFilho ? "#06B6D444" : "#6C63FF44"}` }}>
                {isFilho ? `${idade} anos` : "Responsável"}
              </span>
              {m.tipoSanguineo && (
                <span style={{ ...cs.badge, background: "#EF444422", color: "#F87171", border: "1px solid #EF444433" }}>
                  🩸 {m.tipoSanguineo}
                </span>
              )}
            </div>
            {/* Alergias — sempre visíveis */}
            {m.alergias.length > 0 && (
              <div style={cs.alergiasRow}>
                {m.alergias.map(a => (
                  <span key={a} style={cs.alergiaTag}>⚠ {a}</span>
                ))}
              </div>
            )}
            {m.alergias.length === 0 && (
              <span style={cs.semAlergia}>Sem alergias registradas</span>
            )}
          </div>
        </div>
      </div>

      {/* ── CAMADA 2: Corpo — info operacional do dia ── */}
      <div style={cs.cardBody}>
        {isFilho ? (
          <>
            {/* Medicamentos de hoje */}
            <div style={cs.section}>
              <p style={cs.sectionTitle}>💊 Medicamentos hoje</p>
              {m.medicamentosHoje.length === 0
                ? <p style={cs.empty}>Nenhum remédio cadastrado</p>
                : (
                  <div style={cs.medList}>
                    {m.medicamentosHoje.map((med, i) => (
                      <div key={i} style={cs.medItem}>
                        <span style={{ ...cs.medHora, background: m.cor + "22", color: m.cor }}>{med.hora}</span>
                        <span style={cs.medNome}>{med.nome}</span>
                        <span style={cs.medDose}>{med.dosagem}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Próxima vacina */}
            <div style={{ ...cs.section, borderTop: "1px solid var(--border)" }}>
              <p style={cs.sectionTitle}>💉 Próxima vacina</p>
              {vacFutura ? (
                <div style={cs.vacinaRow}>
                  <span style={cs.vacinaNome}>{vacFutura.nome}</span>
                  <span style={{ ...cs.vacinaData, color: diasVac! <= 7 ? "#EF4444" : diasVac! <= 30 ? "#F59E0B" : "#22C55E" }}>
                    {diasVac === 0 ? "Hoje!" : `em ${diasVac} dias`}
                  </span>
                </div>
              ) : (
                <p style={cs.empty}>Nenhuma vacina agendada</p>
              )}
            </div>

            {/* Escola */}
            {m.escola && (
              <div style={{ ...cs.section, borderTop: "1px solid var(--border)" }}>
                <p style={cs.sectionTitle}>🏫 Escola</p>
                <p style={cs.infoLine}>{m.escola} · {m.serie}</p>
                {m.horarioEscola && <p style={cs.infoLineMuted}>{m.horarioEscola}</p>}
              </div>
            )}
          </>
        ) : (
          /* Pais: convênio + CPF */
          <>
            <div style={cs.section}>
              <p style={cs.sectionTitle}>🏥 Plano de Saúde</p>
              {m.convenio
                ? <><p style={cs.infoLine}>{m.convenio}</p><p style={cs.infoLineMuted}>Carteirinha: {m.carteirinha || "—"}</p></>
                : <p style={cs.empty}>Não cadastrado</p>
              }
            </div>
            <div style={{ ...cs.section, borderTop: "1px solid var(--border)" }}>
              <p style={cs.sectionTitle}>📋 Documentos</p>
              <p style={cs.infoLine}>CPF: {maskCPF(m.cpf)}</p>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={cs.cardFooter}>
        {isFilho && m.pediatra && (
          <span style={cs.footerInfo}>👨‍⚕️ {m.pediatra}</span>
        )}
        <button onClick={onEdit} style={{ ...cs.editBtn, marginLeft: "auto", borderColor: m.cor + "55", color: m.cor }}>
          Editar perfil
        </button>
      </div>
    </div>
  );
}

// ── Modal de edição completo ──────────────────────────────
type Tab = "basico" | "saude" | "escola" | "convenio" | "emergencia";

function EditModal({ m, onClose, onSave }: { m: Member; onClose: () => void; onSave: (m: Member) => void }) {
  const [form, setForm] = useState<Member>({ ...m, alergias: [...m.alergias], medicamentosHoje: m.medicamentosHoje.map(x => ({ ...x })) });
  const [tab, setTab] = useState<Tab>("basico");
  const [alergia, setAlergia] = useState("");
  const [novoMed, setNovoMed] = useState<MedHoje>({ nome: "", hora: "", dosagem: "" });

  const set = (f: Partial<Member>) => setForm(p => ({ ...p, ...f }));

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "basico",     label: "Básico",    icon: "👤" },
    { id: "saude",      label: "Saúde",     icon: "❤️" },
    ...(form.role === "filho" ? [{ id: "escola" as Tab, label: "Escola", icon: "🏫" }] : []),
    { id: "convenio",   label: "Convênio",  icon: "🏥" },
    { id: "emergencia", label: "Emergência",icon: "🚨" },
  ];

  return (
    <div style={em.overlay}>
      <div style={em.modal} className="fade-in">

        {/* Header */}
        <div style={em.header}>
          <div style={em.headerLeft}>
            <span style={{ ...em.avatarSmall, background: form.cor + "22" }}>{form.emoji}</span>
            <div>
              <p style={em.headerName}>{form.nome}</p>
              <p style={em.headerSub}>{form.role === "filho" ? `${calcIdade(form.dataNascimento)} anos` : "Responsável"}</p>
            </div>
          </div>
          <button onClick={onClose} style={em.closeBtn}>✕</button>
        </div>

        {/* Abas */}
        <div style={em.tabs}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              ...em.tab,
              borderBottom: tab === t.id ? `2px solid ${form.cor}` : "2px solid transparent",
              color: tab === t.id ? "#fff" : "var(--text-muted)",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={em.body}>

          {/* ── Básico ── */}
          {tab === "basico" && (
            <div style={em.grid2}>
              <Field label="Nome" value={form.nome} onChange={v => set({ nome: v })} />
              <Field label="Data de Nascimento" type="date" value={form.dataNascimento} onChange={v => set({ dataNascimento: v })} />
              <Field label="CPF" value={form.cpf} onChange={v => set({ cpf: v })} placeholder="000.000.000-00" />
              <Field label="RG" value={form.rg} onChange={v => set({ rg: v })} />
              {form.role === "filho" && (
                <Field label="Certidão de Nascimento" value={form.certidao} onChange={v => set({ certidao: v })} span2 />
              )}
              <Field label="Peso (kg)" value={form.peso} onChange={v => set({ peso: v })} placeholder="Ex: 22.5" />
              <Field label="Altura (cm)" value={form.altura} onChange={v => set({ altura: v })} placeholder="Ex: 115" />
            </div>
          )}

          {/* ── Saúde ── */}
          {tab === "saude" && (
            <div style={em.grid2}>
              <Field label="Tipo Sanguíneo" value={form.tipoSanguineo} onChange={v => set({ tipoSanguineo: v })} placeholder="Ex: O+" />
              <Field label="Última consulta" type="date" value={form.ultimaConsulta} onChange={v => set({ ultimaConsulta: v })} />
              <Field label="Histórico de cirurgias" value={form.cirurgias} onChange={v => set({ cirurgias: v })} span2 placeholder="Descreva se houver" />

              {/* Alergias */}
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={em.label}>Alergias</p>
                <div style={em.tagRow}>
                  {form.alergias.map(a => (
                    <span key={a} style={em.alergyTag}>
                      {a}
                      <button onClick={() => set({ alergias: form.alergias.filter(x => x !== a) })}
                        style={{ background: "none", border: "none", color: "#F87171", marginLeft: 4, cursor: "pointer", fontSize: 13 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <input style={em.input} value={alergia} onChange={e => setAlergia(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && alergia.trim()) { set({ alergias: [...form.alergias, alergia.trim()] }); setAlergia(""); }}}
                    placeholder="Ex: Penicilina, Dipirona..." />
                  <button style={em.addBtn} onClick={() => { if (alergia.trim()) { set({ alergias: [...form.alergias, alergia.trim()] }); setAlergia(""); }}}>+ Add</button>
                </div>
              </div>

              {form.role === "filho" && (
                <>
                  <Field label="Pediatra" value={form.pediatra} onChange={v => set({ pediatra: v })} placeholder="Nome do pediatra" />
                  <Field label="Telefone do Pediatra" value={form.pediatraTel} onChange={v => set({ pediatraTel: v })} placeholder="(00) 00000-0000" />
                  <Field label="Próxima Vacina" value={form.proximaVacina.nome} onChange={v => set({ proximaVacina: { ...form.proximaVacina, nome: v } })} placeholder="Ex: Hepatite A" />
                  <Field label="Data da Vacina" type="date" value={form.proximaVacina.data} onChange={v => set({ proximaVacina: { ...form.proximaVacina, data: v } })} />

                  {/* Medicamentos de hoje */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={em.label}>Medicamentos de Hoje</p>
                    {form.medicamentosHoje.map((med, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                        <span style={{ ...em.input, flex: 2, display: "flex", alignItems: "center", color: "var(--text)" }}>{med.hora} — {med.nome} — {med.dosagem}</span>
                        <button onClick={() => set({ medicamentosHoje: form.medicamentosHoje.filter((_, j) => j !== i) })}
                          style={{ background: "#EF444422", border: "none", color: "#F87171", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6, marginTop: 6 }}>
                      <input style={em.input} placeholder="Horário (08:00)" value={novoMed.hora} onChange={e => setNovoMed(p => ({ ...p, hora: e.target.value }))} />
                      <input style={em.input} placeholder="Remédio" value={novoMed.nome} onChange={e => setNovoMed(p => ({ ...p, nome: e.target.value }))} />
                      <input style={em.input} placeholder="Dosagem" value={novoMed.dosagem} onChange={e => setNovoMed(p => ({ ...p, dosagem: e.target.value }))} />
                      <button style={em.addBtn} onClick={() => {
                        if (novoMed.nome && novoMed.hora) {
                          set({ medicamentosHoje: [...form.medicamentosHoje, { ...novoMed }] });
                          setNovoMed({ nome: "", hora: "", dosagem: "" });
                        }
                      }}>+ Add</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Escola (filhos) ── */}
          {tab === "escola" && form.role === "filho" && (
            <div style={em.grid2}>
              <Field label="Nome da Escola" value={form.escola} onChange={v => set({ escola: v })} span2 placeholder="Ex: Escola Municipal..." />
              <Field label="Série / Turma" value={form.serie} onChange={v => set({ serie: v })} placeholder="Ex: 3º ano A" />
              <Field label="Professora" value={form.professora} onChange={v => set({ professora: v })} placeholder="Nome da professora" />
              <Field label="Horário" value={form.horarioEscola} onChange={v => set({ horarioEscola: v })} placeholder="Ex: 7h às 12h" />
              <Field label="Telefone da Escola" value={form.telEscola} onChange={v => set({ telEscola: v })} placeholder="(00) 00000-0000" />
            </div>
          )}

          {/* ── Convênio ── */}
          {tab === "convenio" && (
            <div style={em.grid2}>
              <Field label="Nome do Plano" value={form.convenio} onChange={v => set({ convenio: v })} span2 placeholder="Ex: Unimed, Bradesco Saúde..." />
              <Field label="Número da Carteirinha" value={form.carteirinha} onChange={v => set({ carteirinha: v })} span2 placeholder="000000000000" />
            </div>
          )}

          {/* ── Emergência ── */}
          {tab === "emergencia" && (
            <div style={em.grid2}>
              <Field label="Nome do Contato" value={form.contatoEmergencia} onChange={v => set({ contatoEmergencia: v })} placeholder="Nome completo" />
              <Field label="Telefone" value={form.contatoTelefone} onChange={v => set({ contatoTelefone: v })} placeholder="(00) 00000-0000" />
              <div style={{ gridColumn: "1 / -1", background: "#F59E0B11", border: "1px solid #F59E0B33", borderRadius: 10, padding: "12px 16px" }}>
                <p style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>⚠ Tipo sanguíneo visível no card</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Configure o tipo sanguíneo na aba Saúde — ele sempre aparece no topo do card para acesso rápido em emergências.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={em.footer}>
          <button onClick={onClose} style={em.cancelBtn}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ ...em.saveBtn, background: form.cor }}>Salvar perfil</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, span2 }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; span2?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...(span2 ? { gridColumn: "1 / -1" } : {}) }}>
      <label style={em.label}>{label}</label>
      <input style={em.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

// ── Página ────────────────────────────────────────────────
export function FamilyPage() {
  const storeMembers = useFamilyStore((s) => s.members);
  const medications = useFamilyStore((s) => s.medications);
  const updateMember = useFamilyStore((s) => s.updateMember);
  const [editing, setEditing] = useState<Member | null>(null);

  // Mapear os membros do Supabase para o formato local Member
  const members: Member[] = storeMembers.map((m: any) => {
    let emoji = "👤";
    let cor = "#888888";
    if (m.nome === "Frantiesco") { emoji = "👨"; cor = "#6C63FF"; }
    else if (m.nome === "Maiara") { emoji = "👩"; cor = "#EC4899"; }
    else if (m.nome === "Benjamin") { emoji = "👦"; cor = "#06B6D4"; }
    else if (m.nome === "Dominic") { emoji = "👶"; cor = "#22C55E"; }

    const profileArray = m.health_profiles;
    const profile = Array.isArray(profileArray) ? profileArray[0] : profileArray;

    const medsHoje = medications
      .filter((med) => med.member_id === m.id)
      .map((med) => ({
        nome: med.nome_remedio,
        hora: med.horario_inicio,
        dosagem: med.dosagem,
      }));

    return {
      id: m.id,
      nome: m.nome,
      role: m.role,
      dataNascimento: m.data_nascimento || "",
      emoji,
      cor,
      tipoSanguineo: profile?.tipo_sanguineo || "",
      alergias: profile?.alergias || [],
      peso: "",
      altura: "",
      ultimaConsulta: "",
      cirurgias: profile?.observacoes || "",
      cpf: "",
      rg: "",
      certidao: "",
      convenio: "",
      carteirinha: "",
      contatoEmergencia: "",
      contatoTelefone: "",
      pediatra: profile?.contato_pediatra || "",
      pediatraTel: "",
      proximaVacina: { nome: "", data: "" },
      medicamentosHoje: medsHoje,
      escola: "",
      serie: "",
      professora: "",
      horarioEscola: "",
      telEscola: "",
    };
  });

  return (
    <div style={pg.page}>
      <div style={pg.header}>
        <div>
          <h1 style={pg.title}>Família</h1>
          <p style={pg.desc}>Perfis, saúde e rotina de cada membro</p>
        </div>
      </div>

      <div style={pg.grid}>
        {members.map(m => (
          <MemberCard key={m.id} m={m} onEdit={() => setEditing(m)} />
        ))}
      </div>

      {editing && (
        <EditModal
          m={editing}
          onClose={() => setEditing(null)}
          onSave={async (updated) => {
            await updateMember(updated.id, updated);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}


// ── Estilos ───────────────────────────────────────────────
const cs: Record<string, React.CSSProperties> = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" },
  cardTop: { padding: "16px 18px" },
  topRow: { display: "flex", gap: 14, alignItems: "flex-start" },
  avatar: { width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  topInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 5 },
  topName: { fontSize: 17, fontWeight: 700, color: "#fff" },
  topMeta: { display: "flex", gap: 6, flexWrap: "wrap" },
  badge: { fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 },
  alergiasRow: { display: "flex", gap: 5, flexWrap: "wrap", marginTop: 2 },
  alergiaTag: { fontSize: 11, fontWeight: 600, background: "#EF444418", color: "#F87171", border: "1px solid #EF444430", borderRadius: 6, padding: "2px 7px" },
  semAlergia: { fontSize: 11, color: "var(--text-muted)" },
  cardBody: { padding: "12px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 0 },
  section: { paddingBottom: 12, paddingTop: 10 },
  sectionTitle: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  medList: { display: "flex", flexDirection: "column", gap: 5 },
  medItem: { display: "flex", alignItems: "center", gap: 8 },
  medHora: { fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 6 },
  medNome: { fontSize: 13, color: "#fff", fontWeight: 500, flex: 1 },
  medDose: { fontSize: 11, color: "var(--text-muted)" },
  vacinaRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  vacinaNome: { fontSize: 13, color: "#fff", fontWeight: 500 },
  vacinaData: { fontSize: 12, fontWeight: 700 },
  infoLine: { fontSize: 13, color: "#fff", fontWeight: 500 },
  infoLineMuted: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  empty: { fontSize: 12, color: "var(--text-muted)" },
  cardFooter: { padding: "10px 18px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 },
  footerInfo: { fontSize: 12, color: "var(--text-muted)" },
  editBtn: { background: "transparent", border: "1px solid", borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600 },
};

const em: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, width: "100%", maxWidth: 580, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  avatarSmall: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  headerName: { fontSize: 16, fontWeight: 700, color: "#fff" },
  headerSub: { fontSize: 12, color: "var(--text-muted)" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, cursor: "pointer" },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", padding: "0 8px" },
  tab: { background: "none", border: "none", padding: "10px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" },
  body: { padding: "20px 24px", overflowY: "auto", flex: 1 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
  addBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  alergyTag: { display: "flex", alignItems: "center", background: "#EF444418", color: "#F87171", border: "1px solid #EF444430", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 500 },
  footer: { padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" },
  saveBtn: { border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};

const pg: Record<string, React.CSSProperties> = {
  page: { padding: "28px 32px", overflowY: "auto", height: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, color: "#fff" },
  desc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
};
