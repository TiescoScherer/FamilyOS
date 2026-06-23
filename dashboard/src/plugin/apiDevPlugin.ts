import type { Plugin, ViteDevServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs";
import path from "node:path";

function resolveApiKey(): string {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;

  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match) return match[1].trim();
    }
  } catch (e) {
    console.error("[api-dev-plugin] Erro ao ler .env.local:", e);
  }

  try {
    const envPath = path.resolve(process.cwd(), "../.env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
      if (match) return match[1].trim();
    }
  } catch {}

  return "";
}

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

export function apiDevPlugin(): Plugin {
  const apiKey = resolveApiKey();
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  return {
    name: "api-dev-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        // 1. Interceptar interpretar-transacao
        if (req.url.startsWith("/api/interpretar-transacao")) {
          if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          if (!genAI) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "GEMINI_API_KEY não configurada no ambiente local" }));
            return;
          }

          let body = "";
          req.on("data", chunk => { body += chunk; });
          req.on("end", async () => {
            try {
              const { texto } = JSON.parse(body);
              if (!texto) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Texto é obrigatório" }));
                return;
              }

              const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction: `Você é um assistente financeiro familiar altamente inteligente e perspicaz. 
Sua tarefa é analisar uma frase ou áudio transcrito (que pode conter gírias, erros de fala, linguagem coloquial e conversas indiretas) e extrair os detalhes financeiros no formato estruturado JSON.

Instruções cruciais:
1. Extraia o "tipo": "despesa" se o dinheiro saiu/foi gasto, ou "receita" se o dinheiro entrou/ganhou.
2. Identifique o "valor" exato como número decimal (ex: 70.00). Se a fala disser "setenta reais", o valor is 70.
3. Crie uma "descricao" curta e clara da compra (ex: se o usuário disser "gastar r$ 70 com um menino que me vende ervas finas", a descrição ideal é "Ervas finas". Se disser "gastei no mercado oitenta reais", a descrição é "Mercado"). Evite colocar termos subjetivos ou conversas de primeira pessoa na descrição.
4. Categorize a transação em uma das seguintes opções: Alimentação, Saúde, Educação, Transporte, Lazer, Moradia, Roupas, Outros. Se for receita, classifique como Salário, Freelance, Investimento, Aluguel ou Outros.
5. Defina a "data" no formato YYYY-MM-DD. Use a data de hoje (${new Date().toISOString().slice(0, 10)}) se nenhuma data específica (como ontem, anteontem, etc.) for dita.
6. Identifique o "membro" da família (Frantiesco, Maiara, Benjamin, Dominic ou Família). Se não for mencionado um membro específico, use "Família".

Retorne APENAS o JSON puro, sem marcações markdown de bloco de código, apenas o objeto solicitado.
${SCHEMA_TRANSACAO}`,
                generationConfig: { responseMimeType: "application/json" }
              });

              const result = await model.generateContent(texto);
              const raw = result.response.text();
              const dados = JSON.parse(raw);

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(dados));
            } catch (err: any) {
              console.error("[api-dev-plugin] Erro ao interpretar transação:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. Interceptar interpretar-comprovante
        if (req.url.startsWith("/api/interpretar-comprovante")) {
          if (req.method !== "POST") {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Method not allowed" }));
            return;
          }

          if (!genAI) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "GEMINI_API_KEY não configurada no ambiente local" }));
            return;
          }

          let body = "";
          req.on("data", chunk => { body += chunk; });
          req.on("end", async () => {
            try {
              const { imagem } = JSON.parse(body);
              if (!imagem) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Imagem é obrigatória" }));
                return;
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
- "valor" deve ser o TOTAL da nota (último valor grande)
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

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(dados));
            } catch (err: any) {
              console.error("[api-dev-plugin] Erro ao interpretar comprovante:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        return next();
      });
    }
  };
}
