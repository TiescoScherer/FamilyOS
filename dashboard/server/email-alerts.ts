// Alertas por email usando Resend (https://resend.com — grátis até 3000 emails/mês)
// Setup: npm install resend && definir RESEND_API_KEY no .env

interface AlertaVencimento {
  cartaoNome: string;
  diaVencimento: number;
  valor: number;
  diasRestantes: number;
}

interface AlertaOrcamento {
  categoria: string;
  gasto: number;
  limite: number;
  percentual: number;
}

const EMAIL_FAMILIA = process.env.EMAIL_FAMILIA ?? "sistema.filara@gmail.com";
const RESEND_KEY    = process.env.RESEND_API_KEY ?? "";

async function enviarEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Family OS <noreply@resend.dev>", to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend error: ${res.status}`);
  return res.json();
}

export async function alertaVencimentoCartao(alerta: AlertaVencimento) {
  const urgente = alerta.diasRestantes <= 3;
  await enviarEmail(
    EMAIL_FAMILIA,
    `${urgente ? "🚨 URGENTE" : "⚠️ Lembrete"} — ${alerta.cartaoNome} vence em ${alerta.diasRestantes}d`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:${urgente ? "#EF4444" : "#F59E0B"}">
        ${urgente ? "🚨" : "⚠️"} Cartão vencendo em ${alerta.diasRestantes} dia${alerta.diasRestantes !== 1 ? "s" : ""}
      </h2>
      <p><strong>${alerta.cartaoNome}</strong></p>
      <p>Vencimento: <strong>dia ${alerta.diaVencimento}</strong></p>
      <p>Valor da fatura: <strong style="color:#EF4444">R$ ${alerta.valor.toFixed(2)}</strong></p>
      <hr/>
      <p style="color:#888;font-size:12px">Family OS · Centro de Comando</p>
    </div>
    `
  );
}

export async function alertaOrcamento(alerta: AlertaOrcamento) {
  const critico = alerta.percentual >= 100;
  await enviarEmail(
    EMAIL_FAMILIA,
    `${critico ? "🔴" : "🟡"} Orçamento ${alerta.categoria} — ${Math.round(alerta.percentual)}% utilizado`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:${critico ? "#EF4444" : "#F59E0B"}">
        ${critico ? "Limite excedido!" : "Atenção ao orçamento"}
      </h2>
      <p>Categoria: <strong>${alerta.categoria}</strong></p>
      <p>Gasto: <strong>R$ ${alerta.gasto.toFixed(2)}</strong> de R$ ${alerta.limite.toFixed(2)}</p>
      <div style="background:#f5f5f5;border-radius:8px;height:12px;margin:12px 0">
        <div style="background:${critico ? "#EF4444" : "#F59E0B"};border-radius:8px;height:100%;width:${Math.min(100, alerta.percentual)}%"></div>
      </div>
      <hr/>
      <p style="color:#888;font-size:12px">Family OS · Centro de Comando</p>
    </div>
    `
  );
}

export async function resumoSemanal(dados: {
  receitas: number; despesas: number; saldo: number;
  topCategoria: string; cartoesProxVenc: string[];
}) {
  await enviarEmail(
    EMAIL_FAMILIA,
    `📊 Resumo semanal — Family OS`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2>📊 Resumo da Semana</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td>💰 Receitas</td><td style="color:#22C55E;text-align:right;font-weight:700">R$ ${dados.receitas.toFixed(2)}</td></tr>
        <tr><td>💸 Despesas</td><td style="color:#EF4444;text-align:right;font-weight:700">R$ ${dados.despesas.toFixed(2)}</td></tr>
        <tr><td>📈 Saldo</td><td style="color:${dados.saldo >= 0 ? "#22C55E" : "#EF4444"};text-align:right;font-weight:700">R$ ${dados.saldo.toFixed(2)}</td></tr>
      </table>
      <p>🏆 Maior gasto: <strong>${dados.topCategoria}</strong></p>
      ${dados.cartoesProxVenc.length ? `<p>⚠️ Cartões vencendo em breve: ${dados.cartoesProxVenc.join(", ")}</p>` : ""}
      <hr/>
      <p style="color:#888;font-size:12px">Family OS · Centro de Comando</p>
    </div>
    `
  );
}
