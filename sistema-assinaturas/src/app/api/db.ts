import fs from 'fs';
import path from 'path';

export interface Contrato {
  id: string;
  cliente_nome: string;
  cliente_documento: string;
  cliente_email: string;
  cliente_whatsapp: string;
  token_acesso: string;
  status: 'pendente' | 'visualizado' | 'assinado_cliente' | 'assinado_total';
  pdf_url: string;
  texto_contrato?: string;
  evidencias_cliente?: {
    ip: string;
    userAgent: string;
    timestamp: string;
    hash: string;
  };
  evidencias_admin?: {
    ip: string;
    userAgent: string;
    timestamp: string;
    hash: string;
  };
  created_at: string;
}

const dbPath = path.join(process.cwd(), 'src/app/api/db.json');

// Inicializa o arquivo de banco local se não existir
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([], null, 2), 'utf-8');
}

export function getContratos(): Contrato[] {
  try {
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao ler banco local:", error);
    return [];
  }
}

export function saveContratos(contratos: Contrato[]) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(contratos, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erro ao gravar no banco local:", error);
  }
}

export function addContrato(contrato: Omit<Contrato, 'id' | 'created_at'>): Contrato {
  const contratos = getContratos();
  const novoContrato: Contrato = {
    ...contrato,
    id: `id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString()
  };
  contratos.push(novoContrato);
  saveContratos(contratos);
  return novoContrato;
}

export function updateContrato(token: string, updates: Partial<Contrato>): Contrato | null {
  const contratos = getContratos();
  const index = contratos.findIndex(c => c.token_acesso === token);
  if (index === -1) return null;

  contratos[index] = { ...contratos[index], ...updates };
  saveContratos(contratos);
  return contratos[index];
}
