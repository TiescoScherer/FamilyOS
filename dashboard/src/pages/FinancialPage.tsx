import { useState } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import { CreditCards } from "@/components/financial/CreditCards";
import { BudgetTracker } from "@/components/financial/BudgetTracker";
import { SmartInput } from "@/components/financial/SmartInput";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { ContaFixa } from "@/types/financial";

type Aba = "visao-geral" | "cartoes" | "orcamento" | "transacoes" | "contas-fixas";

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: "visao-geral",  label: "Visão Geral",   icon: "📊" },
  { id: "cartoes",      label: "Cartões",        icon: "💳" },
  { id: "orcamento",    label: "Orçamento",      icon: "🎯" },
  { id: "transacoes",   label: "Transações",     icon: "📋" },
  { id: "contas-fixas", label: "Contas Fixas",   icon: "📌" },
];

const ICONES_CATEGORIAS: Record<string, string> = {
  Moradia: "🏠",
  Alimentação: "🛒",
  Saúde: "💊",
  Educação: "📚",
  Transporte: "🚗",
  Lazer: "🎉",
  Outros: "📦"
};

const CATEGORIAS_ORDEM = ["Moradia", "Alimentação", "Saúde", "Educação", "Transporte", "Lazer", "Outros"];


function TransacaoItem({ t, onRemove, onConfirm }: { t: ReturnType<typeof useFinancialStore.getState>["transacoes"][0]; onRemove: () => void; onConfirm: () => void }) {
  const origemIcon = t.origem === "audio" ? "🎙" : t.origem === "foto" ? "📷" : "✏️";
  const pendente = t.confirmada === false;
  return (
    <div style={{ 
      ...fp.tRow, 
      borderLeft: pendente ? "4px solid var(--amber)" : `4px solid ${t.tipo === "receita" ? "#22C55E" : "#EF4444"}`,
      background: pendente ? "rgba(245, 158, 11, 0.03)" : "var(--bg-card)",
    }}>
      <div style={{ ...fp.tIcon, background: t.tipo === "receita" ? "#22C55E22" : "#EF444422" }}>
        {t.tipo === "receita" ? "💰" : "💸"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={fp.tDesc}>
          {t.descricao}
          {pendente && (
            <span style={{ 
              marginLeft: 8, 
              fontSize: 10, 
              fontWeight: 700, 
              background: "rgba(245, 158, 11, 0.15)", 
              color: "var(--amber)", 
              padding: "2px 6px", 
              borderRadius: 4, 
              textTransform: "uppercase",
              letterSpacing: 0.5
            }}>
              Revisar ⚠️
            </span>
          )}
        </p>
        <p style={fp.tMeta}>{t.categoria} · {t.membro} · {new Date(t.data + "T12:00").toLocaleDateString("pt-BR")} <span title="origem" style={{ marginLeft: 6 }}>{origemIcon}</span></p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <p style={{ fontWeight: 700, color: t.tipo === "receita" ? "#22C55E" : "#EF4444" }}>
          {t.tipo === "receita" ? "+" : "-"} R$ {t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        {pendente && (
          <button 
            onClick={onConfirm} 
            style={{ 
              background: "#22C55E22", 
              border: "1px solid #22C55E44", 
              color: "#22C55E", 
              borderRadius: 6, 
              padding: "4px 8px", 
              fontSize: 11, 
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4
            }}
          >
            Confirmar ✅
          </button>
        )}
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
  const [mesSelecionado, setMesSelecionado] = useState(() => new Date().toISOString().slice(0, 7));
  const { transacoes, contasFixas, removeTransacao, toggleContaFixa, removeContaFixa, cartoes, confirmarTransacao } = useFinancialStore();
  const isMobile = useIsMobile();

  const mes = mesSelecionado;
  const receitas = transacoes.filter(t => t.tipo === "receita" && t.data.startsWith(mes)).reduce((s, t) => s + t.valor, 0);
  const despesas = transacoes.filter(t => t.tipo === "despesa" && t.data.startsWith(mes)).reduce((s, t) => s + t.valor, 0);

  const contasFixasCalculadas = contasFixas.map(c => {
    const paga = transacoes.some(t => 
      t.confirmada &&
      t.tipo === "despesa" &&
      t.data.startsWith(mes) &&
      (t.descricao.toLowerCase().includes(c.nome.toLowerCase()) || c.nome.toLowerCase().includes(t.descricao.toLowerCase()))
    );
    return { ...c, paga };
  });

  const totalFixas = contasFixasCalculadas.reduce((s, c) => s + c.valor, 0);
  const fixasPagas = contasFixasCalculadas.filter(c => c.paga).reduce((s, c) => s + c.valor, 0);
  const totalCartoes = cartoes.reduce((s, c) => s + c.gastoMes, 0);

  return (
    <div style={{ ...fp.page, padding: isMobile ? "16px" : "28px 32px" }}>
      {/* Header */}
      <div style={{ ...fp.pageHeader, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={fp.pageTitle}>Financeiro</h1>
          <p style={fp.pageDesc}>Controle completo das finanças da família</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Período:</label>
          <input 
            type="month" 
            value={mesSelecionado} 
            onChange={e => setMesSelecionado(e.target.value)} 
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 8,
              padding: "8px 14px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer"
            }}
          />
        </div>
      </div>

      {/* KPIs rápidos */}
      <div style={{ ...fp.kpis, gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)" }}>
        {[
          { label: "Receitas", value: receitas, color: "#22C55E", icon: "💰" },
          { label: "Despesas", value: despesas, color: "#EF4444", icon: "💸" },
          { label: "Saldo",    value: receitas - despesas, color: receitas - despesas >= 0 ? "#22C55E" : "#EF4444", icon: "📈" },
          { label: "Em cartões", value: totalCartoes, color: "#6C63FF", icon: "💳" },
          { label: "Contas fixas pagas", value: fixasPagas, color: "#F59E0B", icon: `${contasFixasCalculadas.filter(c=>c.paga).length}/${contasFixasCalculadas.length}` },
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
      <div style={{ marginBottom: 20 }}>
        <SmartInput />
      </div>

      {/* Abas */}
      <div style={{ ...fp.tabs, overflowX: "auto", flexShrink: 0 }}>
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
      <div>
        {aba === "visao-geral" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            <BudgetTracker />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Últimas transações</p>
              {transacoes.slice(0, 6).map(t => <TransacaoItem key={t.id} t={t} onRemove={() => removeTransacao(t.id)} onConfirm={() => confirmarTransacao(t.id)} />)}
              {transacoes.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Nenhuma transação ainda. Use o botão acima.</p>}
            </div>
          </div>
        )}

        {aba === "cartoes" && <CreditCards />}

        {aba === "orcamento" && <BudgetTracker />}

        {aba === "transacoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {transacoes.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "20px 0" }}>Nenhuma transação ainda.</p>}
            {transacoes.map(t => <TransacaoItem key={t.id} t={t} onRemove={() => removeTransacao(t.id)} onConfirm={() => confirmarTransacao(t.id)} />)}
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
             {contasFixasCalculadas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>📌</p>
                <p>Nenhuma conta fixa cadastrada</p>
                <button onClick={() => setModalConta(true)} style={{ ...fp.addBtn, marginTop: 12 }}>Adicionar primeira conta</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {CATEGORIAS_ORDEM.map(cat => {
                  const contasDaCategoria = contasFixasCalculadas.filter(c => c.categoria === cat);
                  if (contasDaCategoria.length === 0) return null;

                  const totalCat = contasDaCategoria.reduce((s, c) => s + c.valor, 0);
                  const pagasCat = contasDaCategoria.filter(c => c.paga).length;

                  return (
                    <div key={cat} style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-light)", borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: 10, marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
                          <span style={{ fontSize: 15 }}>{ICONES_CATEGORIAS[cat] || "📌"}</span> {cat}
                        </p>
                        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)" }}>
                          <span>Pagas: <strong style={{ color: pagasCat === contasDaCategoria.length ? "#22C55E" : "var(--amber)" }}>{pagasCat}/{contasDaCategoria.length}</strong></span>
                          <span>Total: <strong style={{ color: "#fff" }}>R$ {totalCat.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {contasDaCategoria.map(c => (
                          <ContaFixaItem key={c.id} c={c} onToggle={() => toggleContaFixa(c.id, mes)} onRemove={() => removeContaFixa(c.id)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {modalConta && <NovaContaModal onClose={() => setModalConta(false)} />}
    </div>
  );
}

const fp: Record<string, React.CSSProperties> = {
  page: { padding: "28px 32px", overflowY: "auto", height: "100%" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { fontSize: 26, fontWeight: 800, color: "#fff" },
  pageDesc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 },
  kpi: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" },
  kpiLabel: { fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 5 },
  kpiVal: { fontSize: 17, fontWeight: 700 },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", gap: 0, marginBottom: 20 },
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
