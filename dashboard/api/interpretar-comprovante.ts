import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);


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
      systemInstruction: `Você é um leitor especialista em recibos, notas fiscais e comprovantes de supermercado.
Analise a imagem e extraia TODOS os dados da compra.
Use a data de hoje se não encontrar uma data: ${new Date().toISOString().slice(0, 10)}.

Retorne APENAS um JSON puro (sem markdown) com esta estrutura:
{
  "tipo": "despesa",
  "descricao": "Nome do estabelecimento (ex: Supermercado Extra, Padaria São João)",
  "valor": total da compra como número,
  "categoria": "Alimentação",
  "data": "YYYY-MM-DD",
  "membro": "Família",
  "itens": [
    { "nome": "nome do produto", "quantidade": 1 }
  ]
}

Regras:
- "valor" deve ser o TOTAL da nota (último valor grande), não a soma manual dos itens
- "itens" deve conter TODOS os produtos comprados que aparecerem na nota
- Para cada item, "quantidade" deve ser o número de unidades compradas
- Se não conseguir ler os itens, coloque um array vazio em "itens"`,
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent([
      { inlineData: { mimeType: "image/jpeg", data: imagem } },
      { text: "Leia esta nota fiscal ou recibo e extraia todos os dados conforme o formato solicitado." }
    ]);

    const dados = JSON.parse(result.response.text());
    return res.status(200).json(dados);
  } catch (err: any) {
    console.error("Erro na API de comprovante Gemini:", err);
    return res.status(500).json({ error: "IA indisponível", details: err.message });
  }
}
