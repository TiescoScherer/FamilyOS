import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CATEGORIAS = ["Alimentação","Saúde","Educação","Transporte","Lazer","Moradia","Roupas","Outros","Salário","Freelance","Investimento","Aluguel"];

const SCHEMA_TRANSACAO = `
Retorne SOMENTE um JSON válido com esta estrutura (sem markdown):
{
  "tipo": "despesa" | "receita",
  "descricao": string,
  "valor": number,
  "categoria": uma de [${CATEGORIAS.join(", ")}],
  "data": "YYYY-MM-DD",
  "membro": "Frantiesco" | "Maiara" | "Benjamin" | "Dominic" | "Família"
}
Use a data de hoje se não for mencionada: ${new Date().toISOString().slice(0, 10)}
`;

export async function interpretarTexto(texto: string) {
  const msg = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: `Você é um assistente financeiro da família. Analise o texto e extraia os dados da transação.
${SCHEMA_TRANSACAO}`,
    messages: [{ role: "user", content: texto }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return JSON.parse(raw);
}

export async function interpretarComprovante(imagemBase64: string) {
  const msg = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `Você é um leitor de comprovantes e recibos. Analise a imagem e extraia os dados da transação.
${SCHEMA_TRANSACAO}
Se houver múltiplos itens, some tudo e retorne o total como uma despesa de Alimentação.`,
    messages: [{
      role: "user",
      content: [{
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: imagemBase64 },
      }, {
        type: "text",
        text: "Extraia os dados desta nota fiscal ou comprovante.",
      }],
    }],
  });

  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  return JSON.parse(raw);
}

export async function transcreverAudio(audioBase64: string) {
  // Claude não processa áudio diretamente — usa Whisper via OpenAI ou Web Speech API no browser.
  // Esta rota recebe o texto já transcrito pelo browser (Web Speech API) e retorna diretamente.
  return { texto: audioBase64 };
}
