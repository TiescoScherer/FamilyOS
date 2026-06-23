import { useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useIsMobile } from "@/hooks/useIsMobile";


export function HealthPage() {
  const members = useFamilyStore((s) => s.members);
  const medications = useFamilyStore((s) => s.medications);
  const addRemedio = useFamilyStore((s) => s.addRemedio);
  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);
  const [novoMed, setNovoMed] = useState({
    member_id: "",
    nome_remedio: "",
    dosagem: "",
    horario_inicio: "08:00",
    frequencia_horas: 8,
    status_ativo: true,
  });

  const getMemberDetails = (memberId: string) => {
    const m = members.find((x) => x.id === memberId);
    if (!m) return { nome: "Família", emoji: "👥", cor: "#888888" };
    let emoji = "👤";
    let cor = "#888888";
    if (m.nome === "Frantiesco") { emoji = "👨"; cor = "#6C63FF"; }
    else if (m.nome === "Maiara") { emoji = "👩"; cor = "#EC4899"; }
    else if (m.nome === "Benjamin") { emoji = "👦"; cor = "#06B6D4"; }
    else if (m.nome === "Dominic") { emoji = "👶"; cor = "#22C55E"; }
    return { nome: m.nome, emoji, cor };
  };

  const handleAddRemedio = async () => {
    if (!novoMed.member_id || !novoMed.nome_remedio) {
      alert("Por favor, preencha o membro e o nome do remédio.");
      return;
    }
    await addRemedio(novoMed);
    setShowModal(false);
    setNovoMed({
      member_id: "",
      nome_remedio: "",
      dosagem: "",
      horario_inicio: "08:00",
      frequencia_horas: 8,
      status_ativo: true,
    });
  };



  return (
    <div style={{ ...hp.page, padding: isMobile ? "16px" : "28px 32px" }}>
      <div style={{ ...hp.header, flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-start", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={hp.title}>Saúde & Bem-estar</h1>
          <p style={hp.desc}>Controle de rotinas médicas, vacinação e histórico de saúde das crianças</p>
        </div>
        <button onClick={() => setShowModal(true)} style={hp.addBtn}>
          + Novo Medicamento
        </button>
      </div>

      <div style={{ ...hp.grid, gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
        {/* Bloco 1: Rotina diária de Medicamentos */}
        <div style={hp.card}>
          <div style={hp.cardHeader}>
            <span style={hp.cardTitle}>💊 Rotina de Medicamentos</span>
            <span style={hp.cardBadge}>{medications.length} Ativos</span>
          </div>
          <div style={hp.cardBody}>
            {medications.length === 0 ? (
              <p style={hp.emptyText}>Nenhum medicamento cadastrado na rotina diária.</p>
            ) : (
              <div style={hp.medList}>
                {medications.map((med) => {
                  const mDetails = getMemberDetails(med.member_id);
                  return (
                    <div key={med.id} style={{ ...hp.medItem, borderLeft: `4px solid ${mDetails.cor}` }}>
                      <div style={hp.medTimeCol}>
                        <span style={hp.medTime}>{med.horario_inicio}</span>
                        <span style={hp.medFreq}>A cada {med.frequencia_horas}h</span>
                      </div>
                      <div style={hp.medInfoCol}>
                        <p style={hp.medName}>{med.nome_remedio}</p>
                        <p style={hp.medDose}>{med.dosagem || "Sem dosagem"}</p>
                      </div>
                      <div style={hp.medMemberCol}>
                        <span style={{ ...hp.memberTag, background: mDetails.cor + "18", color: mDetails.cor }}>
                          {mDetails.emoji} {mDetails.nome}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bloco 2: Perfis Rápidos de Saúde */}
        <div style={hp.card}>
          <div style={hp.cardHeader}>
            <span style={hp.cardTitle}>👶 Alergias & Informações Clínicas</span>
          </div>
          <div style={hp.cardBody}>
            {members.length === 0 ? (
              <p style={hp.emptyText}>Carregando perfis familiares...</p>
            ) : (
              <div style={hp.profilesList}>
                {members.map((m) => {
                  const mDetails = getMemberDetails(m.id);
                  const profileArray = (m as any).health_profiles;
                  const profile = Array.isArray(profileArray) ? profileArray[0] : profileArray;
                  const alergias: string[] = profile?.alergias || [];

                  return (
                    <div key={m.id} style={hp.profileItem}>
                      <div style={hp.profileHeader}>
                        <span style={{ ...hp.profileAvatar, background: mDetails.cor + "22" }}>{mDetails.emoji}</span>
                        <div>
                          <p style={hp.profileName}>{m.nome}</p>
                          <p style={hp.profileSub}>
                            {m.role === "filho" ? "Filho" : "Responsável"} 
                            {profile?.tipo_sanguineo ? ` · Sangue: ${profile.tipo_sanguineo}` : ""}
                          </p>
                        </div>
                      </div>

                      <div style={hp.profileBody}>
                        {alergias.length > 0 ? (
                          <div style={hp.alergyContainer}>
                            <span style={hp.alertLabel}>Alergias:</span>
                            <div style={hp.alergyTags}>
                              {alergias.map((al, idx) => (
                                <span key={idx} style={hp.alergyTag}>⚠️ {al}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p style={hp.noAlergyText}>Nenhuma alergia relatada.</p>
                        )}

                        {profile?.observacoes && (
                          <div style={hp.obsContainer}>
                            <span style={hp.obsLabel}>Cirurgias/Histórico:</span>
                            <p style={hp.obsText}>{profile.observacoes}</p>
                          </div>
                        )}

                        {m.role === "filho" && profile?.contato_pediatra && (
                          <div style={hp.pedContainer}>
                            <span style={hp.pedLabel}>👨‍⚕️ Pediatra:</span>
                            <span style={hp.pedValue}>{profile.contato_pediatra}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de cadastro de medicamento */}
      {showModal && (
        <div style={hp.overlay}>
          <div style={hp.modal}>
            <div style={hp.modalHeader}>
              <h3 style={hp.modalTitle}>Cadastrar Novo Medicamento</h3>
              <button onClick={() => setShowModal(false)} style={hp.closeBtn}>✕</button>
            </div>
            <div style={hp.modalBody}>
              <div style={hp.field}>
                <label style={hp.label}>Membro da Família</label>
                <select 
                  style={hp.input} 
                  value={novoMed.member_id} 
                  onChange={(e) => setNovoMed(p => ({ ...p, member_id: e.target.value }))}
                >
                  <option value="">Selecione quem vai tomar...</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.role === "filho" ? "Filho" : "Responsável"})</option>
                  ))}
                </select>
              </div>

              <div style={hp.field}>
                <label style={hp.label}>Nome do Remédio</label>
                <input 
                  style={hp.input} 
                  placeholder="Ex: Paracetamol, Amoxicilina" 
                  value={novoMed.nome_remedio}
                  onChange={(e) => setNovoMed(p => ({ ...p, nome_remedio: e.target.value }))}
                />
              </div>

              <div style={hp.field}>
                <label style={hp.label}>Dosagem</label>
                <input 
                  style={hp.input} 
                  placeholder="Ex: 5ml, 1 comprimido, 10 gotas" 
                  value={novoMed.dosagem}
                  onChange={(e) => setNovoMed(p => ({ ...p, dosagem: e.target.value }))}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={hp.field}>
                  <label style={hp.label}>Horário Inicial</label>
                  <input 
                    style={hp.input} 
                    type="time" 
                    value={novoMed.horario_inicio}
                    onChange={(e) => setNovoMed(p => ({ ...p, horario_inicio: e.target.value }))}
                  />
                </div>
                <div style={hp.field}>
                  <label style={hp.label}>Frequência (horas)</label>
                  <select 
                    style={hp.input} 
                    value={novoMed.frequencia_horas}
                    onChange={(e) => setNovoMed(p => ({ ...p, frequencia_horas: parseInt(e.target.value) }))}
                  >
                    <option value={4}>A cada 4 horas</option>
                    <option value={6}>A cada 6 horas</option>
                    <option value={8}>A cada 8 horas</option>
                    <option value={12}>A cada 12 horas</option>
                    <option value={24}>Uma vez ao dia</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={hp.modalFooter}>
              <button onClick={() => setShowModal(false)} style={hp.cancelBtn}>Cancelar</button>
              <button onClick={handleAddRemedio} style={hp.saveBtn}>Salvar Medicamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const hp: Record<string, React.CSSProperties> = {
  page: { padding: "28px 32px", overflowY: "auto", height: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, color: "#fff" },
  desc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  addBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" },
  cardHeader: { padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  cardBadge: { fontSize: 11, fontWeight: 600, background: "var(--accent)22", color: "var(--accent)", border: "1px solid var(--accent)33", borderRadius: 99, padding: "2px 8px" },
  cardBody: { padding: "20px" },
  emptyText: { fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" },
  medList: { display: "flex", flexDirection: "column", gap: 12 },
  medItem: { display: "flex", alignItems: "center", gap: 14, background: "var(--bg-hover)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border-light)", borderLeftWidth: 4 },
  medTimeCol: { display: "flex", flexDirection: "column", width: 90, flexShrink: 0 },
  medTime: { fontSize: 15, fontWeight: 700, color: "#fff" },
  medFreq: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  medInfoCol: { flex: 1 },
  medName: { fontSize: 13, color: "#fff", fontWeight: 600 },
  medDose: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  medMemberCol: { display: "flex", alignItems: "center" },
  memberTag: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 },
  
  profilesList: { display: "flex", flexDirection: "column", gap: 16 },
  profileItem: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 12 },
  profileHeader: { display: "flex", gap: 12, alignItems: "center" },
  profileAvatar: { width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  profileName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  profileSub: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  profileBody: { display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 10 },
  alergyContainer: { display: "flex", alignItems: "center", gap: 8 },
  alertLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },
  alergyTags: { display: "flex", flexWrap: "wrap", gap: 6 },
  alergyTag: { fontSize: 11, fontWeight: 600, background: "#EF444415", color: "#F87171", border: "1px solid #EF444425", borderRadius: 6, padding: "2px 7px" },
  noAlergyText: { fontSize: 12, color: "var(--text-muted)" },
  obsContainer: { display: "flex", flexDirection: "column", gap: 4 },
  obsLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },
  obsText: { fontSize: 12, color: "#fff" },
  pedContainer: { display: "flex", gap: 6, alignItems: "center" },
  pedLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },
  pedValue: { fontSize: 12, color: "#fff" },

  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", overflow: "hidden" },
  modalHeader: { padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" },
  modalTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  modalBody: { padding: "20px", display: "flex", flexDirection: "column", gap: 12 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
  modalFooter: { padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
