import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const CATEGORIAS = ["Alimentação", "Saúde", "Educação", "Transporte", "Lazer", "Moradia", "Roupas", "Outros", "Salário", "Freelance", "Investimento", "Aluguel"];

const SCHEMA_TRANSACAO = `
Retorne SOMENTE um JSON válido com esta estrutura:
{
  "tipo": "despesa" | "receita",
  "descricao": string,
  "valor": number,
  "categoria": uma de [${CATEGORIAS.join(", ")}],
  "data": "YYYY-MM-DD",
  "membro": "Frantiesco" | "Maiara" | "Benjamin" | "Dominic" | "Família"
}
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { texto } = req.body;
    if (!texto) {
      return res.status(400).json({ error: "Texto é obrigatório" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Você é um assistente financeiro de família. Analise o texto e extraia os dados da transação. Use a data de hoje se não for mencionada: ${new Date().toISOString().slice(0, 10)}.
${SCHEMA_TRANSACAO}`,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(texto);
    const raw = result.response.text();
    const dados = JSON.parse(raw);

    return res.status(200).json(dados);
  } catch (err: any) {
    console.error("Erro na API de transação Gemini:", err);
    return res.status(500).json({ error: "IA indisponível", details: err.message });
  }
}
