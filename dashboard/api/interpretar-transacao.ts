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
      model: "gemini-2.5-flash",
      systemInstruction: `Você é um assistente financeiro familiar altamente inteligente e perspicaz. 
Sua tarefa é analisar uma frase ou áudio transcrito (que pode conter gírias, erros de fala, linguagem coloquial e conversas indiretas) e extrair os detalhes financeiros no formato estruturado JSON.

Instruções cruciais:
1. Extraia o "tipo": "despesa" se o dinheiro saiu/foi gasto, ou "receita" se o dinheiro entrou/ganhou.
2. Identifique o "valor" exato como número decimal (ex: 70.00). Se a fala disser "setenta reais", o valor é 70.
3. Crie uma "descricao" curta e clara da compra (ex: se o usuário disser "gastar r$ 70 com um menino que me vende ervas finas", a descrição ideal é "Ervas finas". Se disser "gastei no mercado oitenta reais", a descrição é "Mercado"). Evite colocar termos subjetivos ou conversas de primeira pessoa na descrição (ex: NÃO coloque "eu quero saber se tu tá anotando" na descrição).
4. Categorize a transação em uma das seguintes opções: Alimentação, Saúde, Educação, Transporte, Lazer, Moradia, Roupas, Outros. Se for receita, classifique como Salário, Freelance, Investimento, Aluguel ou Outros.
5. Defina a "data" no formato YYYY-MM-DD. Use a data de hoje (${new Date().toISOString().slice(0, 10)}) se nenhuma data específica (como ontem, anteontem, etc.) for dita.
6. Identifique o "membro" da família (Frantiesco, Maiara, Benjamin, Dominic ou Família). Se não for mencionado um membro específico, use "Família".

Retorne APENAS o JSON puro, sem marcações markdown de bloco de código (\`\`\`json), apenas o objeto solicitado.
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
