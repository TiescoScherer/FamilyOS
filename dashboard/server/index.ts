import http from "http";
import { interpretarTexto, interpretarComprovante } from "./ai-api.js";

const PORT = 3001;

function json(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST" });
    return res.end();
  }

  if (req.method !== "POST") return json(res, { error: "Method not allowed" }, 405);

  const body = JSON.parse(await readBody(req));

  try {
    if (req.url === "/api/interpretar-transacao") {
      const dados = await interpretarTexto(body.texto);
      return json(res, dados);
    }

    if (req.url === "/api/interpretar-comprovante") {
      const dados = await interpretarComprovante(body.imagem);
      return json(res, dados);
    }

    if (req.url === "/api/transcrever-audio") {
      // Retorna o texto já vindo do browser (Web Speech API transcreve no cliente)
      return json(res, { texto: body.audio });
    }

    json(res, { error: "Not found" }, 404);
  } catch (err) {
    console.error(err);
    json(res, { error: "IA indisponível" }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`[AI Server] rodando em http://localhost:${PORT}`);
});
