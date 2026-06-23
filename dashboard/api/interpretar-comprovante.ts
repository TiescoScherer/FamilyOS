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
    const { imagem } = req.body; // base64
    if (!imagem) {
      return res.status(400).json({ error: "Imagem (base64) é obrigatória" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `Você é um leitor de comprovantes e recibos. Analise a imagem e extraia os dados da transação.
Se houver múltiplos itens, some tudo e retorne o total como uma despesa de Alimentação. Use a data de hoje se não for mencionada: ${new Date().toISOString().slice(0, 10)}.
${SCHEMA_TRANSACAO}`,
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const parts = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imagem
        }
      },
      {
        text: "Extraia os dados desta nota fiscal ou comprovante."
      }
    ];

    const result = await model.generateContent(parts);
    const raw = result.response.text();
    const dados = JSON.parse(raw);

    return res.status(200).json(dados);
  } catch (err: any) {
    console.error("Erro na API de comprovante Gemini:", err);
    return res.status(500).json({ error: "IA indisponível", details: err.message });
  }
}
