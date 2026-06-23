import { useState } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import { CreditCards } from "@/components/financial/CreditCards";
import { BudgetTracker } from "@/components/financial/BudgetTracker";
import { SmartInput } from "@/components/financial/SmartInput";
import type { ContaFixa } from "@/types/financial";

type Aba = "visao-geral" | "cartoes" | "orcamento" | "transacoes" | "contas-fixas";

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "visao-geral",  label: "Visão Geral",   icon: "📊" },
  { id: "cartoes",      label: "Cartões",        icon: "💳" },
  { id: "orcamento",    label: "Orçamento",      icon: "🎯" },
  { id: "transacoes",   label: "Transações",     icon: "📋" },
  { id: "contas-fixas", label: "Contas Fixas",   icon: "📌" },
];

function TransacaoItem({ t, onRemove }: { t: ReturnType<typeof useFinancialStore.getState>["transacoes"][0]; onRemove: () => void }) {
  const origemIcon = t.origem === "audio" ? "🎙" : t.origem === "foto" ? "📷" : "✏️";
  return (
    <div style={fp.tRow}>
      <div style={{ ...fp.tIcon, background: t.tipo === "receita" ? "#22C55E22" : "#EF444422" }}>
        {t.tipo === "receita" ? "💰" : "💸"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={fp.tDesc}>{t.descricao}</p>
        <p style={fp.tMeta}>{t.categoria} · {t.membro} · {new Date(t.data + "T12:00").toLocaleDateString("pt-BR")} <span title="origem">{origemIcon}</span></p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <p style={{ fontWeight: 700, color: t.tipo === "receita" ? "#22C55E" : "#EF4444" }}>
          {t.tipo === "receita" ? "+" : "-"} R$ {t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        <button onClick={onRemove} style={fp.removeBtn}>✕</button>
      </div>
    </div>
  );
}

function ContaFixaItem({ c, onToggle, onRemove }: { c: ContaFixa; onToggle: () => void; onRemove: () => void }) {
  return (
    <div style={{ ...fp.tRow, opacity: c.paga ? 0.55 : 1 }}>
      <div style={{ ...fp.tIcon, background: c.paga ? "#22C55E22" : "#F59E0B22" }}>
        {c.paga ? "✅" : "📌"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={fp.tDesc}>{c.nome}</p>
        <p style={fp.tMeta}>{c.categoria} · vence dia {c.vencimento}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontWeight: 700, color: "#fff" }}>R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        <button onClick={onToggle} style={{ ...fp.toggleBtn, background: c.paga ? "#22C55E22" : "var(--accent-glow)", color: c.paga ? "#22C55E" : "var(--accent)" }}>
          {c.paga ? "Paga" : "Marcar paga"}
        </button>
        <button onClick={onRemove} style={fp.removeBtn}>✕</button>
      </div>
    </div>
  );
}

function NovaContaModal({ onClose }: { onClose: () => void }) {
  const { addContaFixa } = useFinancialStore();
  const [f, setF] = useState({ nome: "", valor: "", vencimento: "10", categoria: "Moradia" });
  const CATS = ["Moradia", "Alimentação", "Saúde", "Educação", "Transporte", "Lazer", "Outros"];

  return (
    <div style={fp.overlay}>
      <div style={fp.modal} className="fade-in">
        <div style={fp.mHeader}><h2 style={fp.mTitle}>Nova Conta Fixa</h2><button onClick={onClose} style={fp.closeBtn}>✕</button></div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={fp.field}><label style={fp.label}>Nome</label><input style={fp.input} value={f.nome} onChange={e => setF(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Aluguel, Internet..." /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fp.field}><label style={fp.label}>Valor (R$)</label><input style={fp.input} type="number" value={f.valor} onChange={e => setF(p => ({ ...p, valor: e.target.value }))} /></div>
            <div style={fp.field}><label style={fp.label}>Dia vencimento</label><input style={fp.input} type="number" min="1" max="31" value={f.vencimento} onChange={e => setF(p => ({ ...p, vencimento: e.target.value }))} /></div>
          </div>
          <div style={fp.field}><label style={fp.label}>Categoria</label>
            <select style={fp.input} value={f.categoria} onChange={e => setF(p => ({ ...p, categoria: e.target.value }))}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={fp.mFooter}>
          <button onClick={onClose} style={fp.cancelBtn}>Cancelar</button>
          <button onClick={() => { if (!f.nome || !f.valor) return; addContaFixa({ nome: f.nome, valor: parseFloat(f.valor), vencimento: parseInt(f.vencimento), categoria: f.categoria, paga: false }); onClose(); }} style={fp.saveBtn}>Adicionar</button>
        </div>
      </div>
    </div>
  );
}

export function FinancialPage() {
  const [aba, setAba] = useState<Aba>("visao-geral");
  const [modalConta, setModalConta] = useState(false);
  const { transacoes, contasFixas, removeTransacao, toggleContaFixa, removeContaFixa, cartoes } = useFinancialStore();

  const mes = new Date().toISOString().slice(0, 7);
  const receitas = transacoes.filter(t => t.tipo === "receita" && t.data.startsWith(mes)).reduce((s, t) => s + t.valor, 0);
  const despesas = transacoes.filter(t => t.tipo === "despesa" && t.data.startsWith(mes)).reduce((s, t) => s + t.valor, 0);
  const totalFixas = contasFixas.reduce((s, c) => s + c.valor, 0);
  const fixasPagas = contasFixas.filter(c => c.paga).reduce((s, c) => s + c.valor, 0);
  const totalCartoes = cartoes.reduce((s, c) => s + c.gastoMes, 0);

  return (
    <div style={fp.page}>
      {/* Header */}
      <div style={fp.pageHeader}>
        <div>
          <h1 style={fp.pageTitle}>Financeiro</h1>
          <p style={fp.pageDesc}>Controle completo das finanças da família</p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div style={fp.kpis}>
        {[
          { label: "Receitas", value: receitas, color: "#22C55E", icon: "💰" },
          { label: "Despesas", value: despesas, color: "#EF4444", icon: "💸" },
          { label: "Saldo",    value: receitas - despesas, color: receitas - despesas >= 0 ? "#22C55E" : "#EF4444", icon: "📈" },
          { label: "Em cartões", value: totalCartoes, color: "#6C63FF", icon: "💳" },
          { label: "Contas fixas pagas", value: fixasPagas, color: "#F59E0B", icon: `${contasFixas.filter(c=>c.paga).length}/${contasFixas.length}` },
        ].map(k => (
          <div key={k.label} style={fp.kpi}>
            <p style={fp.kpiLabel}>{k.icon} {k.label}</p>
            <p style={{ ...fp.kpiVal, color: k.color }}>
              {typeof k.icon === "string" && k.icon.includes("/") ? "" : "R$ "}
              {k.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* SmartInput — sempre visível */}
      <SmartInput />

      {/* Abas */}
      <div style={fp.tabs}>
        {ABAS.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)} style={{
            ...fp.tab,
            borderBottom: aba === a.id ? "2px solid var(--accent)" : "2px solid transparent",
            color: aba === a.id ? "#fff" : "var(--text-muted)",
          }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1 }}>
        {aba === "visao-geral" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <BudgetTracker />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Últimas transações</p>
              {transacoes.slice(0, 6).map(t => <TransacaoItem key={t.id} t={t} onRemove={() => removeTransacao(t.id)} />)}
              {transacoes.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma transação ainda. Use o botão acima.</p>}
            </div>
          </div>
        )}

        {aba === "cartoes" && <CreditCards />}

        {aba === "orcamento" && <BudgetTracker />}

        {aba === "transacoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {transacoes.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>Nenhuma transação ainda.</p>}
            {transacoes.map(t => <TransacaoItem key={t.id} t={t} onRemove={() => removeTransacao(t.id)} />)}
          </div>
        )}

        {aba === "contas-fixas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Total fixo mensal: <strong style={{ color: "#fff" }}>R$ {totalFixas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </p>
              <button onClick={() => setModalConta(true)} style={fp.addBtn}>+ Nova Conta</button>
            </div>
            {contasFixas.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📌</p>
                <p>Nenhuma conta fixa cadastrada</p>
                <button onClick={() => setModalConta(true)} style={{ ...fp.addBtn, marginTop: 12 }}>Adicionar primeira conta</button>
              </div>
            )}
            {contasFixas.map(c => (
              <ContaFixaItem key={c.id} c={c} onToggle={() => toggleContaFixa(c.id)} onRemove={() => removeContaFixa(c.id)} />
            ))}
          </div>
        )}
      </div>

      {modalConta && <NovaContaModal onClose={() => setModalConta(false)} />}
    </div>
  );
}

const fp: Record<string, React.CSSProperties> = {
  page: { padding: "28px 32px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 20 },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "#fff" },
  pageDesc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 },
  kpi: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" },
  kpiLabel: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
  kpiVal: { fontSize: 17, fontWeight: 700 },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", gap: 0 },
  tab: { background: "none", border: "none", padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "color 0.15s", whiteSpace: "nowrap" },
  tRow: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 16px", display: "flex", alignItems: "center", gap: 12 },
  tIcon: { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  tDesc: { fontSize: 13, fontWeight: 600, color: "#fff" },
  tMeta: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  removeBtn: { background: "#EF444418", border: "none", color: "#EF4444", borderRadius: 6, width: 24, height: 24, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  toggleBtn: { border: "1px solid transparent", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  addBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 14, width: "100%", maxWidth: 420, overflow: "hidden" },
  mHeader: { padding: "18px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" },
  mTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
  mFooter: { padding: "14px 24px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer" },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
