import { useState } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import type { CreditCard } from "@/types/financial";

const BANDEIRAS = { visa: "VISA", mastercard: "MC", elo: "ELO", amex: "AMEX", outro: "•••" };
const CORES = ["#6C63FF", "#EC4899", "#22C55E", "#F59E0B", "#06B6D4", "#EF4444"];
const MEMBROS = ["Frantiesco", "Maiara", "Família"];

function diasAteVencer(diaVenc: number) {
  const hoje = new Date();
  let alvo = new Date(hoje.getFullYear(), hoje.getMonth(), diaVenc);
  if (alvo <= hoje) alvo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVenc);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000);
}

function CardVisual({ card }: { card: CreditCard }) {
  const pct = Math.min(100, (card.gastoMes / card.limite) * 100);
  const dias = diasAteVencer(card.diaVencimento);
  const alertColor = dias <= 3 ? "#EF4444" : dias <= 7 ? "#F59E0B" : "#22C55E";
  const barColor = pct >= 90 ? "#EF4444" : pct >= 70 ? "#F59E0B" : card.cor;

  return (
    <div style={{ ...cs.card, background: `linear-gradient(135deg, ${card.cor}22 0%, ${card.cor}08 100%)`, border: `1px solid ${card.cor}44` }}>
      {/* Topo */}
      <div style={cs.cardTop}>
        <div>
          <p style={cs.cardNome}>{card.nome}</p>
          <p style={cs.cardTitular}>{card.titular}</p>
        </div>
        <span style={{ ...cs.bandeira, color: card.cor, borderColor: card.cor + "44" }}>
          {BANDEIRAS[card.bandeira]}
        </span>
      </div>

      {/* Gasto vs limite */}
      <div style={cs.gastoSection}>
        <div style={cs.gastoRow}>
          <span style={cs.gastoLabel}>Gasto este mês</span>
          <span style={cs.gastoValores}>
            <span style={{ color: barColor, fontWeight: 700 }}>
              R$ {card.gastoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {" "}/ R$ {card.limite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </span>
        </div>
        <div style={cs.barTrack}>
          <div style={{ ...cs.barFill, width: `${pct}%`, background: barColor }} />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
          Disponível: R$ {(card.limite - card.gastoMes).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Datas */}
      <div style={cs.datas}>
        <div style={cs.dataItem}>
          <span style={cs.dataLabel}>Fechamento</span>
          <span style={cs.dataVal}>Dia {card.diaFechamento}</span>
        </div>
        <div style={cs.dataItem}>
          <span style={cs.dataLabel}>Vencimento</span>
          <span style={{ ...cs.dataVal, color: alertColor }}>
            Dia {card.diaVencimento} · {dias === 0 ? "Hoje!" : `${dias}d`}
          </span>
        </div>
      </div>
    </div>
  );
}

function NovoCartaoModal({ onClose }: { onClose: () => void }) {
  const { addCartao } = useFinancialStore();
  const [f, setF] = useState({
    nome: "", bandeira: "visa" as CreditCard["bandeira"], titular: "Frantiesco",
    limite: "", diaFechamento: "1", diaVencimento: "10", cor: CORES[0],
  });

  const salvar = () => {
    if (!f.nome || !f.limite) return;
    addCartao({
      id: Date.now().toString(),
      nome: f.nome, bandeira: f.bandeira, titular: f.titular,
      limite: parseFloat(f.limite), diaFechamento: parseInt(f.diaFechamento),
      diaVencimento: parseInt(f.diaVencimento), cor: f.cor, gastoMes: 0,
    });
    onClose();
  };

  return (
    <div style={cs.overlay}>
      <div style={cs.modal} className="fade-in">
        <div style={cs.mHeader}>
          <h2 style={cs.mTitle}>Novo Cartão</h2>
          <button onClick={onClose} style={cs.closeBtn}>✕</button>
        </div>

        <div style={cs.mBody}>
          {/* Preview */}
          <div style={{ ...cs.previewCard, background: `linear-gradient(135deg, ${f.cor}33, ${f.cor}11)`, borderColor: f.cor + "55" }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{f.nome || "Nome do cartão"}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.titular}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: f.cor, marginTop: 8 }}>
              {BANDEIRAS[f.bandeira]}
            </p>
          </div>

          <div style={cs.grid2}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={cs.label}>Nome do cartão</label>
              <input style={cs.input} value={f.nome} onChange={e => setF(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Nubank, C6, Inter..." />
            </div>
            <div>
              <label style={cs.label}>Bandeira</label>
              <select style={cs.input} value={f.bandeira} onChange={e => setF(p => ({ ...p, bandeira: e.target.value as CreditCard["bandeira"] }))}>
                {Object.entries(BANDEIRAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={cs.label}>Titular</label>
              <select style={cs.input} value={f.titular} onChange={e => setF(p => ({ ...p, titular: e.target.value }))}>
                {MEMBROS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={cs.label}>Limite (R$)</label>
              <input style={cs.input} type="number" value={f.limite} onChange={e => setF(p => ({ ...p, limite: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <label style={cs.label}>Dia fechamento</label>
              <input style={cs.input} type="number" min="1" max="31" value={f.diaFechamento} onChange={e => setF(p => ({ ...p, diaFechamento: e.target.value }))} />
            </div>
            <div>
              <label style={cs.label}>Dia vencimento</label>
              <input style={cs.input} type="number" min="1" max="31" value={f.diaVencimento} onChange={e => setF(p => ({ ...p, diaVencimento: e.target.value }))} />
            </div>
            <div>
              <label style={cs.label}>Cor</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {CORES.map(c => (
                  <button key={c} onClick={() => setF(p => ({ ...p, cor: c }))}
                    style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: f.cor === c ? "3px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={cs.mFooter}>
          <button onClick={onClose} style={cs.cancelBtn}>Cancelar</button>
          <button onClick={salvar} style={cs.saveBtn}>Adicionar cartão</button>
        </div>
      </div>
    </div>
  );
}

export function CreditCards() {
  const { cartoes } = useFinancialStore();
  const [modal, setModal] = useState(false);

  const totalGasto = cartoes.reduce((s, c) => s + c.gastoMes, 0);
  const totalLimite = cartoes.reduce((s, c) => s + c.limite, 0);
  const proximoVenc = cartoes.length
    ? cartoes.reduce((a, b) => diasAteVencer(a.diaVencimento) <= diasAteVencer(b.diaVencimento) ? a : b)
    : null;

  return (
    <div style={cs.root}>
      {/* Resumo topo */}
      {cartoes.length > 0 && (
        <div style={cs.resumo}>
          <div style={cs.resumoItem}>
            <p style={cs.resumoLabel}>Total em faturas</p>
            <p style={{ ...cs.resumoVal, color: "#EF4444" }}>R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div style={cs.resumoItem}>
            <p style={cs.resumoLabel}>Limite total disponível</p>
            <p style={{ ...cs.resumoVal, color: "#22C55E" }}>R$ {(totalLimite - totalGasto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          {proximoVenc && (
            <div style={cs.resumoItem}>
              <p style={cs.resumoLabel}>Próximo vencimento</p>
              <p style={cs.resumoVal}>{proximoVenc.nome} · dia {proximoVenc.diaVencimento}</p>
            </div>
          )}
        </div>
      )}

      {/* Cards */}
      <div style={cs.cardsGrid}>
        {cartoes.map(c => <CardVisual key={c.id} card={c} />)}
        <button onClick={() => setModal(true)} style={cs.addCard}>
          <span style={{ fontSize: 28, color: "var(--text-muted)" }}>+</span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Adicionar cartão</span>
        </button>
      </div>

      {modal && <NovoCartaoModal onClose={() => setModal(false)} />}
    </div>
  );
}

const cs: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 16 },
  resumo: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  resumoItem: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px" },
  resumoLabel: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 },
  resumoVal: { fontSize: 18, fontWeight: 700, color: "#fff" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 },
  card: { borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  cardNome: { fontSize: 15, fontWeight: 700, color: "#fff" },
  cardTitular: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  bandeira: { fontSize: 11, fontWeight: 800, border: "1px solid", borderRadius: 6, padding: "3px 8px", letterSpacing: 1 },
  gastoSection: { display: "flex", flexDirection: "column", gap: 6 },
  gastoRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  gastoLabel: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  gastoValores: { fontSize: 13 },
  barTrack: { height: 6, background: "#ffffff18", borderRadius: 99 },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },
  datas: { display: "flex", gap: 16 },
  dataItem: { display: "flex", flexDirection: "column", gap: 2 },
  dataLabel: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 },
  dataVal: { fontSize: 13, fontWeight: 600, color: "#fff" },
  addCard: { borderRadius: 14, border: "2px dashed var(--border-light)", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px", cursor: "pointer", minHeight: 160 },
  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", overflow: "hidden" },
  mHeader: { padding: "20px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" },
  mTitle: { fontSize: 17, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  mBody: { padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 },
  previewCard: { borderRadius: 12, padding: "16px 20px", border: "1px solid" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
  mFooter: { padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
