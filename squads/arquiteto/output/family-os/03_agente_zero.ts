import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const SYSTEM_PROMPT = `
Você é o Agente Zero do Family OS, assistente pessoal da família de Frantiesco e Maiara.
Sua missão é entender mensagens rápidas e informais dos pais e registrar as informações nas tabelas corretas do sistema familiar.

Membros da Família:
- Frantiesco (pai, admin)
- Maiara (mãe, admin)
- Benjamin (filho, 8 anos)
- Dominic (filho, 4 anos)

Regras:
1. Faça APENAS UMA pergunta por vez.
2. Responda sempre de forma curta e direta — máximo 2 linhas.
3. Confirme o registro antes de inserir: repita os dados interpretados e pergunte "Confirma?".
4. Se o input for ambíguo, pergunte qual filho ou qual categoria antes de registrar.
5. Nunca invente dados. Se não entendeu, diga "Não entendi. Pode repetir de outro jeito?"

Tabelas disponíveis:
- financial_records → tipo: "receita"|"despesa", descricao, valor, categoria, data, member_id
- medications_routines → member_id, nome_remedio, dosagem, frequencia_horas, horario_inicio
- shopping_list → member_id (opcional), item, categoria, quantidade, urgente
- future_goals → titulo, valor_alvo, valor_atual, prazo, categoria
- health_profiles → member_id, alergias (array), tipo_sanguineo, contato_pediatra

Responda SEMPRE em JSON válido com este formato:
{
  "mensagem": "texto curto para o usuário",
  "action": null | { "tabela": string, "dados": object }
}

O campo "action" só é preenchido APÓS o usuário confirmar com "sim", "confirma" ou "ok".
`.trim();

interface AgentResponse {
  mensagem: string;
  action: null | { tabela: string; dados: Record<string, unknown> };
}

type Message = { role: "user" | "assistant"; content: string };

const conversationHistory: Message[] = [];

async function getFamilyMemberId(nome: string): Promise<string | null> {
  const { data } = await supabase
    .from("family_members")
    .select("id")
    .ilike("nome", `${nome}%`)
    .single();
  return data?.id ?? null;
}

async function executeInsert(action: AgentResponse["action"]): Promise<void> {
  if (!action) return;

  const { tabela, dados } = action;

  // Resolve member_id se vier como nome
  if (typeof dados.member_nome === "string") {
    const id = await getFamilyMemberId(dados.member_nome);
    if (id) {
      dados.member_id = id;
    }
    delete dados.member_nome;
  }

  const { error } = await supabase.from(tabela).insert(dados);
  if (error) throw new Error(`Erro ao inserir em ${tabela}: ${error.message}`);
}

export async function chat(userMessage: string): Promise<string> {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: conversationHistory,
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  conversationHistory.push({ role: "assistant", content: rawText });

  let parsed: AgentResponse;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return rawText;
  }

  // Se há action confirmada, executa o insert
  if (parsed.action) {
    await executeInsert(parsed.action);
    return `✅ ${parsed.mensagem}`;
  }

  return parsed.mensagem;
}

// ── Exemplo de uso ─────────────────────────────────────────
// const reply1 = await chat("Dominic precisa tomar dipirona 2.5ml a cada 8 horas");
// console.log(reply1);
// → "Entendi! Vou registrar: Dominic — Dipirona 2.5ml a cada 8h, começando às 08:00. Confirma?"
//
// const reply2 = await chat("sim");
// console.log(reply2);
// → "✅ Remédio do Dominic registrado com sucesso!"
