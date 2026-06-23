import { useState, useRef, useEffect } from "react";
import { useFinancialStore } from "@/store/useFinancialStore";
import type { Transacao } from "@/types/financial";

const MEMBROS = ["Frantiesco", "Maiara", "Benjamin", "Dominic", "Família"];
const CATS_DESPESA = ["Alimentação", "Saúde", "Educação", "Transporte", "Lazer", "Moradia", "Roupas", "Outros"];
const CATS_RECEITA = ["Salário", "Freelance", "Investimento", "Aluguel", "Outros"];

// ── Serviço de IA ─────────────────────────────────────────
async function interpretarTexto(texto: string): Promise<Partial<Transacao> | null> {
  try {
    const res = await fetch("/api/interpretar-transacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function interpretarImagem(base64: string): Promise<Partial<Transacao> | null> {
  try {
    const res = await fetch("/api/interpretar-comprovante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagem: base64 }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Componente de Áudio ───────────────────────────────────
function AudioCapture({ onTexto }: { onTexto: (t: string) => void }) {
  const [gravando, setGravando] = useState(false);
  const [status, setStatus] = useState<"idle" | "gravando" | "processando">("idle");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const iniciar = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("A transcrição de voz não é suportada neste navegador. Tente usar o Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "pt-BR";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setGravando(true);
      setStatus("gravando");
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setGravando(false);
      setStatus("idle");
      alert("Erro ao reconhecer a fala.");
    };

    rec.onend = () => {
      setGravando(false);
      setStatus("idle");
    };

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onTexto(text);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const parar = () => {
    recognitionRef.current?.stop();
    setGravando(false);
    setStatus("idle");
  };

  return (
    <button
      onClick={gravando ? parar : iniciar}
      style={{
        ...ab.btn,
        background: gravando ? "#EF444422" : "#6C63FF22",
        border: `1px solid ${gravando ? "#EF444455" : "#6C63FF55"}`,
        color: gravando ? "#EF4444" : "#6C63FF",
        animation: gravando ? "pulse 1s infinite" : "none",
      }}
      title={gravando ? "Parar gravação" : "Gravar áudio com a voz"}
    >
      {status === "processando" ? "⏳" : gravando ? "⏹" : "🎙"}
    </button>
  );
}

// ── Upload de Foto ────────────────────────────────────────
function FotoUpload({ onDados }: { onDados: (d: Partial<Transacao>) => void }) {
  const [status, setStatus] = useState<"idle" | "lendo">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStatus("lendo");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const dados = await interpretarImagem(base64);
      if (dados) onDados(dados);
      setStatus("idle");
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => inputRef.current?.click()}
        style={{ ...ab.btn, background: "#F59E0B22", border: "1px solid #F59E0B55", color: "#F59E0B" }}
        title="Tirar foto do comprovante ou carregar imagem"
      >
        {status === "lendo" ? "⏳" : "📷"}
      </button>
    </>
  );
}

// ── Componente principal ──────────────────────────────────
export function SmartInput() {
  const { addTransacao, cartoes } = useFinancialStore();
  const [processando, setProcessando] = useState(false);
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [mecanismoOrigem, setMecanismoOrigem] = useState<"manual" | "audio" | "foto">("manual");
  const [form, setForm] = useState<Partial<Transacao>>({
    tipo: "despesa", descricao: "", valor: 0, categoria: "Alimentação",
    data: new Date().toISOString().slice(0, 10), membro: "Maiara", origem: "manual",
  });
  const [textoLivre, setTextoLivre] = useState("");

  const cats = form.tipo === "despesa" ? CATS_DESPESA : CATS_RECEITA;

  const interpretar = async () => {
    if (!textoLivre.trim()) return;
    setProcessando(true);
    const dados = await interpretarTexto(textoLivre);
    if (dados) {
      // Cria a transação diretamente no Supabase com confirmada = false!
      await addTransacao({
        tipo: dados.tipo || "despesa",
        descricao: dados.descricao || textoLivre,
        valor: dados.valor || 0,
        categoria: dados.categoria || "Outros",
        data: dados.data || new Date().toISOString().slice(0, 10),
        membro: dados.membro || "Família",
        cartaoId: dados.cartaoId,
        origem: mecanismoOrigem,
        confirmada: false
      });
      setTextoLivre("");
      setMecanismoOrigem("manual");
    } else {
      alert("Não foi possível interpretar. Digite novamente ou use o formulário manual.");
    }
    setProcessando(false);
  };

  const handleFotoDados = async (dados: Partial<Transacao>) => {
    // Insere a transação da foto diretamente no Supabase como não-confirmada!
    await addTransacao({
      tipo: dados.tipo || "despesa",
      descricao: dados.descricao || "Comprovante por foto",
      valor: dados.valor || 0,
      categoria: dados.categoria || "Outros",
      data: dados.data || new Date().toISOString().slice(0, 10),
      membro: dados.membro || "Família",
      cartaoId: dados.cartaoId,
      origem: "foto",
      confirmada: false
    });
  };

  const salvar = () => {
    if (!form.descricao || !form.valor || !form.categoria) return;
    addTransacao({
      tipo: form.tipo ?? "despesa",
      descricao: form.descricao ?? "",
      valor: form.valor ?? 0,
      categoria: form.categoria ?? "Outros",
      data: form.data ?? new Date().toISOString().slice(0, 10),
      membro: form.membro,
      cartaoId: form.cartaoId,
      origem: "manual",
      confirmada: true // Manual sempre entra confirmado
    });
    setMostrarFormManual(false);
    setForm({ tipo: "despesa", descricao: "", valor: 0, categoria: "Alimentação", data: new Date().toISOString().slice(0, 10), membro: "Maiara", origem: "manual" });
  };

  return (
    <div style={si.panel} className="fade-in">
      <div style={si.panelHeader}>
        <p style={si.panelTitle}>🎙️ Lançamento Rápido</p>
        <button 
          onClick={() => setMostrarFormManual(!mostrarFormManual)} 
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4
          }}
        >
          {mostrarFormManual ? "✕ Ocultar Campos" : "✏️ Abrir Campos Manuais"}
        </button>
      </div>

      {/* Input de linguagem natural integrado com Áudio e Câmera */}
      <div style={si.naturalRow}>
        <input
          style={si.naturalInput}
          value={textoLivre}
          onChange={e => {
            setTextoLivre(e.target.value);
            if (mecanismoOrigem === "audio") setMecanismoOrigem("manual");
          }}
          onKeyDown={e => e.key === "Enter" && interpretar()}
          placeholder='Fale ou escreva. Ex: "Gastei 80 reais no mercado hoje"'
          disabled={processando}
        />
        <AudioCapture onTexto={t => { setTextoLivre(t); setMecanismoOrigem("audio"); }} />
        <FotoUpload onDados={handleFotoDados} />
        <button onClick={interpretar} style={si.iaBtn} disabled={processando || !textoLivre.trim()}>
          {processando ? "Processando... ⏳" : "✨ Interpretar"}
        </button>
      </div>
      <p style={si.hint}>Escreva ou use o microfone 🎙 / foto 📷. A transação vai direto para o extrato abaixo para sua revisão!</p>

      {/* Formulário Manual Opcional */}
      {mostrarFormManual && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={si.formGrid}>
            <div style={si.field}>
              <label style={si.label}>Tipo</label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["despesa", "receita"] as const).map(t => (
                  <button key={t} onClick={() => setForm(p => ({ ...p, tipo: t, categoria: t === "despesa" ? "Alimentação" : "Salário" }))}
                    style={{
                      flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      background: form.tipo === t ? (t === "receita" ? "#22C55E22" : "#EF444422") : "var(--bg-hover)",
                      color: form.tipo === t ? (t === "receita" ? "#22C55E" : "#EF4444") : "var(--text-dim)",
                      border: `1px solid ${form.tipo === t ? (t === "receita" ? "#22C55E44" : "#EF444444") : "var(--border-light)"}`,
                    }}>
                    {t === "receita" ? "💰 Receita" : "💸 Despesa"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...si.field, gridColumn: "1/-1" }}>
              <label style={si.label}>Descrição</label>
              <input style={si.input} value={form.descricao ?? ""} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Ex: Compras no Extra" />
            </div>

            <div style={si.field}>
              <label style={si.label}>Valor (R$)</label>
              <input style={si.input} type="number" value={form.valor || ""} onChange={e => setForm(p => ({ ...p, valor: parseFloat(e.target.value) }))} placeholder="0,00" />
            </div>

            <div style={si.field}>
              <label style={si.label}>Data</label>
              <input style={si.input} type="date" value={form.data ?? ""} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            </div>

            <div style={si.field}>
              <label style={si.label}>Categoria</label>
              <select style={si.input} value={form.categoria ?? ""} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={si.field}>
              <label style={si.label}>Quem pagou</label>
              <select style={si.input} value={form.membro ?? ""} onChange={e => setForm(p => ({ ...p, membro: e.target.value }))}>
                {MEMBROS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {cartoes.length > 0 && (
              <div style={{ ...si.field, gridColumn: "1/-1" }}>
                <label style={si.label}>Cartão (opcional)</label>
                <select style={si.input} value={form.cartaoId ?? ""} onChange={e => setForm(p => ({ ...p, cartaoId: e.target.value || undefined }))}>
                  <option value="">Débito / Dinheiro</option>
                  {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.titular})</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={si.footer}>
            <div style={si.originTag}>
              origem: <strong>manual</strong>
            </div>
            <button onClick={() => setMostrarFormManual(false)} style={si.cancelBtn}>Cancelar</button>
            <button onClick={salvar} style={si.saveBtn}>Registrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ab: Record<string, React.CSSProperties> = {
  btn: {
    borderRadius: 8,
    width: 38,
    height: 38,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    border: "none",
  },
};

const si: Record<string, React.CSSProperties> = {
  bar: { display: "flex", gap: 8 },
  mainBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  panel: { background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 14, overflow: "hidden" },
  panelHeader: { padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)" },
  panelTitle: { fontSize: 15, fontWeight: 700, color: "#fff" },
  closeBtn: { background: "none", border: "none", color: "var(--text-muted)", fontSize: 18, cursor: "pointer" },
  naturalRow: { display: "flex", gap: 8, padding: "14px 20px 0", alignItems: "center" },
  naturalInput: { flex: 1, background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "9px 14px", color: "var(--text)", fontSize: 13, outline: "none", height: 38 },
  iaBtn: { background: "var(--accent)22", border: "1px solid var(--accent)55", color: "var(--accent)", borderRadius: 8, padding: "0 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", height: 38, display: "flex", alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 11, color: "var(--text-muted)", padding: "4px 20px 12px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "0 20px 16px" },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%" },
  footer: { padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 },
  originTag: { fontSize: 11, color: "var(--text-muted)", flex: 1 },
  cancelBtn: { background: "none", border: "1px solid var(--border-light)", color: "var(--text-dim)", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" },
  saveBtn: { background: "var(--accent)", border: "none", color: "#fff", borderRadius: 8, padding: "7px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
