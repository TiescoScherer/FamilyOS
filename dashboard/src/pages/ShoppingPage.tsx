import { useState, useRef } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFinancialStore } from "@/store/useFinancialStore";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ItemRecibo {
  nome: string;
  quantidade: number;
  selecionado: boolean;
}

interface ResultadoRecibo {
  descricao: string;
  valor: number;
  data: string;
  itens: ItemRecibo[];
}

// ── Scanner de Recibo ─────────────────────────────────────
function ReciboScanner({ onResultado }: { onResultado: (r: ResultadoRecibo) => void }) {
  const [status, setStatus] = useState<"idle" | "lendo">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("lendo");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const res = await fetch("/api/interpretar-comprovante", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagem: base64 }),
        });
        const dados = await res.json();
        const itens: ItemRecibo[] = (dados.itens || []).map((i: any) => ({
          nome: i.nome,
          quantidade: i.quantidade || 1,
          selecionado: true,
        }));
        onResultado({
          descricao: dados.descricao || "Supermercado",
          valor: dados.valor || 0,
          data: dados.data || new Date().toISOString().slice(0, 10),
          itens,
        });
      } catch {
        alert("Não foi possível ler o recibo. Tente outra foto.");
      }
      setStatus("idle");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        style={sp.scanBtn}
        disabled={status === "lendo"}
      >
        {status === "lendo" ? "⏳ Lendo recibo..." : "📷 Escanear Recibo"}
      </button>
    </>
  );
}

// ── Modal de Confirmação do Recibo ────────────────────────
function ReciboModal({ resultado, onConfirmar, onFechar }: {
  resultado: ResultadoRecibo;
  onConfirmar: (r: ResultadoRecibo) => void;
  onFechar: () => void;
}) {
  const [r, setR] = useState(resultado);

  const toggleItem = (idx: number) => {
    setR(prev => ({
      ...prev,
      itens: prev.itens.map((it, i) => i === idx ? { ...it, selecionado: !it.selecionado } : it),
    }));
  };

  const itensSelecionados = r.itens.filter(i => i.selecionado).length;

  return (
    <div style={sp.overlay}>
      <div style={sp.modal} className="fade-in">
        <div style={sp.modalHeader}>
          <div>
            <h3 style={sp.modalTitle}>📋 Recibo lido pela IA</h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              Confirme os dados antes de salvar
            </p>
          </div>
          <button onClick={onFechar} style={sp.closeBtn}>✕</button>
        </div>

        {/* Resumo financeiro */}
        <div style={sp.resumoBox}>
          <div style={sp.resumoRow}>
            <span style={sp.resumoLabel}>🏪 Estabelecimento</span>
            <span style={sp.resumoVal}>{r.descricao}</span>
          </div>
          <div style={sp.resumoRow}>
            <span style={sp.resumoLabel}>💰 Total</span>
            <span style={{ ...sp.resumoVal, color: "#EF4444", fontWeight: 700, fontSize: 16 }}>
              R$ {r.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={sp.resumoRow}>
            <span style={sp.resumoLabel}>📅 Data</span>
            <span style={sp.resumoVal}>
              {new Date(r.data + "T12:00").toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        {/* Lista de itens */}
        {r.itens.length > 0 ? (
          <div style={sp.itensList}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                Itens comprados ({itensSelecionados} selecionados)
              </p>
              <button
                onClick={() => setR(prev => ({ ...prev, itens: prev.itens.map(i => ({ ...i, selecionado: true })) }))}
                style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
              >
                Selecionar todos
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
              {r.itens.map((item, idx) => (
                <label key={idx} style={sp.itemRow}>
                  <input
                    type="checkbox"
                    checked={item.selecionado}
                    onChange={() => toggleItem(idx)}
                    style={{ accentColor: "var(--accent)", width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: item.selecionado ? "#fff" : "var(--text-muted)" }}>
                    {item.nome}
                  </span>
                  {item.quantidade > 1 && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 6px", borderRadius: 4 }}>
                      x{item.quantidade}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            A IA não conseguiu identificar itens individuais nesta foto.
            <br />O total será registrado no financeiro.
          </div>
        )}

        <div style={sp.modalFooter}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", flex: 1 }}>
            Salva {itensSelecionados} item(ns) em Compras + R$ {r.valor.toFixed(2)} no Financeiro
          </div>
          <button onClick={onFechar} style={sp.cancelBtn}>Cancelar</button>
          <button onClick={() => onConfirmar(r)} style={sp.saveBtn}>Confirmar ✅</button>
        </div>
      </div>
    </div>
  );
}

// ── Item da lista de compras ──────────────────────────────
function ShoppingItem({ item, onToggle, onRemove }: {
  item: { id: string; item: string; quantidade: number; comprado: boolean; urgente: boolean; categoria?: string; member_nome?: string };
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={{ ...sp.itemCard, opacity: item.comprado ? 0.55 : 1 }}>
      <button onClick={onToggle} style={{ ...sp.checkBtn, background: item.comprado ? "#22C55E22" : "var(--bg-hover)", border: `2px solid ${item.comprado ? "#22C55E" : "var(--border-light)"}` }}>
        {item.comprado ? "✓" : ""}
      </button>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: item.comprado ? "line-through" : "none" }}>
          {item.item}
          {item.urgente && <span style={{ marginLeft: 6, fontSize: 10, color: "#EF4444", fontWeight: 700 }}>URGENTE</span>}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {item.categoria}{item.member_nome ? ` · ${item.member_nome}` : ""}{item.quantidade > 1 ? ` · x${item.quantidade}` : ""}
        </p>
      </div>
      <button onClick={onRemove} style={sp.removeBtn}>✕</button>
    </div>
  );
}

// ── Modal de novo item manual ─────────────────────────────
function NovoItemModal({ onClose, onSave }: { onClose: () => void; onSave: (item: any) => void }) {
  const [f, setF] = useState({ item: "", categoria: "Alimentação", quantidade: 1, urgente: false });
  const CATS = ["Alimentação", "Limpeza", "Higiene", "Bebidas", "Hortifruti", "Outros"];

  return (
    <div style={sp.overlay}>
      <div style={{ ...sp.modal, maxWidth: 380 }} className="fade-in">
        <div style={sp.modalHeader}>
          <h3 style={sp.modalTitle}>Novo Item</h3>
          <button onClick={onClose} style={sp.closeBtn}>✕</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={sp.field}>
            <label style={sp.label}>Nome do item</label>
            <input style={sp.input} value={f.item} onChange={e => setF(p => ({ ...p, item: e.target.value }))} placeholder="Ex: Arroz, Leite, Detergente..." autoFocus />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={sp.field}>
              <label style={sp.label}>Categoria</label>
              <select style={sp.input} value={f.categoria} onChange={e => setF(p => ({ ...p, categoria: e.target.value }))}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={sp.field}>
              <label style={sp.label}>Quantidade</label>
              <input style={sp.input} type="number" min={1} value={f.quantidade} onChange={e => setF(p => ({ ...p, quantidade: parseInt(e.target.value) || 1 }))} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={f.urgente} onChange={e => setF(p => ({ ...p, urgente: e.target.checked }))} style={{ accentColor: "#EF4444", width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: "var(--text)" }}>Urgente 🔴</span>
          </label>
        </div>
        <div style={sp.modalFooter}>
          <button onClick={onClose} style={sp.cancelBtn}>Cancelar</button>
          <button onClick={() => { if (f.item.trim()) { onSave(f); onClose(); } }} style={sp.saveBtn}>Adicionar</button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────
export function ShoppingPage() {
  const { shopping, addCompra, toggleCompra, removeCompra } = useFamilyStore();
  const { addTransacao } = useFinancialStore();
  const isMobile = useIsMobile();

  const [aba, setAba] = useState<"comprar" | "historico">("comprar");
  const [recibo, setRecibo] = useState<ResultadoRecibo | null>(null);
  const [modalNovo, setModalNovo] = useState(false);

  const aComprar = shopping.filter(s => !s.comprado);
  const historico = shopping.filter(s => s.comprado);

  const handleConfirmarRecibo = async (r: ResultadoRecibo) => {
    // 1. Salva no financeiro como despesa
    await addTransacao({
      tipo: "despesa",
      descricao: r.descricao,
      valor: r.valor,
      categoria: "Alimentação",
      data: r.data,
      membro: "Família",
      origem: "foto",
      confirmada: false,
    });

    // 2. Salva cada item selecionado na lista de compras (como comprado)
    const itensSelecionados = r.itens.filter(i => i.selecionado);
    for (const item of itensSelecionados) {
      await addCompra({
        item: item.nome,
        categoria: "Alimentação",
        quantidade: item.quantidade,
        comprado: true,
        urgente: false,
      });
    }

    setRecibo(null);
  };

  return (
    <div style={{ ...sp.page, padding: isMobile ? "16px" : "28px 32px" }}>
      {/* Header */}
      <div style={{ ...sp.header, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={sp.title}>Lista de Compras</h1>
          <p style={sp.desc}>Gerencie os itens e escaneie recibos com a câmera</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ReciboScanner onResultado={setRecibo} />
          <button onClick={() => setModalNovo(true)} style={sp.addBtn}>+ Adicionar</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={sp.tabs}>
        {([
          { id: "comprar", label: `🛒 A Comprar (${aComprar.length})` },
          { id: "historico", label: `✅ Comprados (${historico.length})` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{
            ...sp.tab,
            borderBottom: aba === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            color: aba === t.id ? "#fff" : "var(--text-muted)",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {aba === "comprar" && (
          aComprar.length === 0 ? (
            <div style={sp.empty}>
              <p style={{ fontSize: 32 }}>🛒</p>
              <p>Lista vazia! Adicione itens ou escaneie um recibo.</p>
            </div>
          ) : (
            aComprar.map(item => (
              <ShoppingItem
                key={item.id}
                item={item as any}
                onToggle={() => toggleCompra(item.id)}
                onRemove={() => removeCompra(item.id)}
              />
            ))
          )
        )}
        {aba === "historico" && (
          historico.length === 0 ? (
            <div style={sp.empty}>
              <p style={{ fontSize: 32 }}>📦</p>
              <p>Nenhum item comprado ainda.</p>
            </div>
          ) : (
            historico.map(item => (
              <ShoppingItem
                key={item.id}
                item={item as any}
                onToggle={() => toggleCompra(item.id)}
                onRemove={() => removeCompra(item.id)}
              />
            ))
          )
        )}
      </div>

      {/* Modais */}
      {recibo && (
        <ReciboModal
          resultado={recibo}
          onConfirmar={handleConfirmarRecibo}
          onFechar={() => setRecibo(null)}
        />
      )}
      {modalNovo && (
        <NovoItemModal
          onClose={() => setModalNovo(false)}
          onSave={(f) => addCompra({ item: f.item, categoria: f.categoria, quantidade: f.quantidade, comprado: false, urgente: f.urgente })}
        />
      )}
    </div>
  );
}

const sp: Record<string, React.CSSProperties> = {
  page: { overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 26, fontWeight: 800, color: "#fff" },
  desc: { fontSize: 13, color: "var(--text-muted)", marginTop: 4 },
  scanBtn: {
    background: "#F59E0B22", border: "1px solid #F59E0B55", color: "#F59E0B",
    borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  addBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", gap: 0 },
  tab: { background: "none", border: "none", padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  itemCard: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 },
  checkBtn: { width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#22C55E", fontWeight: 700, cursor: "pointer", flexShrink: 0 },
  removeBtn: { background: "#EF444418", border: "none", color: "#EF4444", borderRadius: 6, width: 26, height: 26, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  empty: { textAlign: "center", padding: "48px 0", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },

  overlay: { position: "fixed", inset: 0, background: "#00000090", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "16px" },
  modal: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" },
  modalHeader: { padding: "18px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  resumoBox: { padding: "14px 20px", background: "var(--bg-hover)", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid var(--border)" },
  resumoRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resumoLabel: { fontSize: 12, color: "var(--text-muted)" },
  resumoVal: { fontSize: 13, color: "#fff", fontWeight: 600 },
  itensList: { padding: "14px 20px", flex: 1, overflowY: "auto" },
  itemRow: { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer", borderBottom: "1px solid var(--border)", paddingBottom: 8 },
  modalFooter: { padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
};
