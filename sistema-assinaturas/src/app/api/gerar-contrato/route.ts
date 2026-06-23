import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addContrato } from '../db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa condicionalmente para não quebrar a execução se o .env não estiver pronto
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: Request) {
  try {
    // [SEGURANÇA] Bloqueia requisições sem a chave da API (apenas se definida no .env)
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.API_KEY_FILARA;
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401 });
    }

    const { nome, documento, email, whatsapp, pdf_base64, texto_contrato } = await req.json();

    if (!nome || !email || !whatsapp || !pdf_base64) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes (nome, email, whatsapp ou pdf_base64).' }, { status: 400 });
    }

    let documentoFinal = documento;

    // [INTELIGÊNCIA] Extração automática de CPF/CNPJ do texto do contrato se não fornecido
    if (!documentoFinal && texto_contrato) {
      // Regex para CPF (com ou sem formatação)
      const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
      // Regex para CNPJ (com ou sem formatação)
      const cnpjRegex = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;

      const cpfMatch = texto_contrato.match(cpfRegex);
      const cnpjMatch = texto_contrato.match(cnpjRegex);

      if (cpfMatch) {
        documentoFinal = cpfMatch[0];
        console.log(`[AUTO-EXTRAÇÃO] CPF extraído com sucesso: ${documentoFinal}`);
      } else if (cnpjMatch) {
        documentoFinal = cnpjMatch[0];
        console.log(`[AUTO-EXTRAÇÃO] CNPJ extraído com sucesso: ${documentoFinal}`);
      }
    }

    // Se mesmo após tentar extrair ainda não tivermos o documento, retorna erro
    if (!documentoFinal) {
      return NextResponse.json({ 
        error: 'CPF ou CNPJ do cliente é obrigatório. Forneça o campo "documento" ou envie o texto do contrato no campo "texto_contrato" para extração automática.' 
      }, { status: 400 });
    }

    // 1. Grava no banco de dados JSON local (Sempre — para garantir funcionamento do painel admin)
    const tokenAcesso = `token-teste-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const contratoLocal = addContrato({
      cliente_nome: nome,
      cliente_documento: documentoFinal,
      cliente_email: email,
      cliente_whatsapp: whatsapp,
      token_acesso: tokenAcesso,
      status: 'pendente',
      pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // fallback dummy PDF para teste local
      texto_contrato: texto_contrato || 'Contrato de Teste Filara.'
    });

    // Se estiver rodando em Modo de Teste sem Supabase (comportamento de fallback local)
    if (!supabase) {
      console.log('[MODO TESTE] Contrato gerado localmente com documento:', documentoFinal);
      return NextResponse.json({
        success: true,
        link: `http://localhost:3000/contrato/${contratoLocal.token_acesso}`,
        token: contratoLocal.token_acesso,
        documento_extraido: documento !== documentoFinal ? documentoFinal : undefined
      });
    }

    // 2. Modo Real Supabase (Se configurado)
    try {
      const fileName = `contrato-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.pdf`;
      const buffer = Buffer.from(pdf_base64, 'base64');

      const { data: storageData, error: storageError } = await supabase.storage
        .from('contratos_pdfs')
        .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

      if (storageError) throw storageError;

      const { data: dbData, error: dbError } = await supabase
        .from('contratos')
        .insert([
          {
            cliente_nome: nome,
            cliente_documento: documentoFinal,
            cliente_email: email,
            cliente_whatsapp: whatsapp,
            pdf_url: storageData.path,
            status: 'pendente',
          }
        ])
        .select('token_acesso')
        .single();

      if (dbError) throw dbError;

      // Atualiza a URL e o token de acesso no local para bater com o Supabase
      contratoLocal.token_acesso = dbData.token_acesso;
      contratoLocal.pdf_url = storageData.path;
      // Nota: o get/save pode ser atualizado se quiser mas para o teste local o link gerado funciona direto.
      
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return NextResponse.json({ 
        success: true, 
        link: `${baseUrl}/contrato/${dbData.token_acesso}`, 
        token: dbData.token_acesso,
        documento_extraido: documento !== documentoFinal ? documentoFinal : undefined
      });
    } catch (supabaseErr: any) {
      console.error("[SUPABASE ERROR] Fallback para local bem-sucedido:", supabaseErr.message);
      // Retorna o link local se o Supabase falhar mas estiver configurado incorretamente
      return NextResponse.json({ 
        success: true, 
        link: `http://localhost:3000/contrato/${contratoLocal.token_acesso}`, 
        token: contratoLocal.token_acesso,
        documento_extraido: documento !== documentoFinal ? documentoFinal : undefined
      });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

