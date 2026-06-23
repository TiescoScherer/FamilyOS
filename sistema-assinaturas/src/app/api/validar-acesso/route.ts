import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getContratos, updateContrato } from '../db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa condicionalmente para não quebrar a execução se o .env não estiver pronto
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: Request) {
  try {
    const { token_acesso, ultimos_digitos } = await req.json();

    if (!token_acesso || !ultimos_digitos) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    // 1. Busca primeiro no banco de dados JSON local
    const contratos = getContratos();
    const contratoLocal = contratos.find(c => c.token_acesso === token_acesso);

    if (contratoLocal) {
      console.log(`[BANCO LOCAL] Processando validação para o token: ${token_acesso}`);

      if (contratoLocal.status === 'assinado_cliente' || contratoLocal.status === 'assinado_total') {
        return NextResponse.json({ error: 'Este contrato já foi assinado.' }, { status: 409 });
      }

      // Valida os 4 últimos dígitos do documento cadastrado localmente
      const documentoLimpo = contratoLocal.cliente_documento.replace(/\D/g, '');
      const digitosEsperados = documentoLimpo.slice(-4);

      if (ultimos_digitos !== digitosEsperados) {
        return NextResponse.json({ 
          error: `Código de verificação inválido para ${contratoLocal.cliente_nome}. Dica: use os 4 últimos dígitos do documento (${digitosEsperados}).`
        }, { status: 403 });
      }

      // Marca localmente como "visualizado"
      if (contratoLocal.status === 'pendente') {
        updateContrato(token_acesso, { status: 'visualizado' });
      }

      return NextResponse.json({
        success: true,
        cliente_nome: contratoLocal.cliente_nome,
        pdf_url: contratoLocal.pdf_url,
      });
    }

    // --- MODO FALLBACK SE NÃO ACHAR LOCAL (OU TENTAR SUPABASE DIRETO) ---
    if (!supabase) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    // Busca o contrato pelo token no Supabase
    const { data, error } = await supabase
      .from('contratos')
      .select('id, cliente_nome, cliente_documento, status, pdf_url')
      .eq('token_acesso', token_acesso)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    if (data.status === 'assinado') {
      return NextResponse.json({ error: 'Este contrato já foi assinado.' }, { status: 409 });
    }

    // [SEGURANÇA] Valida os 4 últimos dígitos do documento (CPF, CNPJ ou celular)
    const documentoLimpo = data.cliente_documento.replace(/\D/g, '');
    const digitosEsperados = documentoLimpo.slice(-4);

    if (ultimos_digitos !== digitosEsperados) {
      return NextResponse.json({ error: 'Código de verificação inválido.' }, { status: 403 });
    }

    // Gera URL assinada temporária (15 min) para o PDF privado no Storage
    const { data: signedData, error: signedError } = await supabase.storage
      .from('contratos_pdfs')
      .createSignedUrl(data.pdf_url, 900);

    if (signedError) throw signedError;

    // Marca como "visualizado" no Supabase
    await supabase
      .from('contratos')
      .update({ status: 'visualizado' })
      .eq('token_acesso', token_acesso)
      .eq('status', 'pendente');

    return NextResponse.json({
      success: true,
      cliente_nome: data.cliente_nome,
      pdf_url: signedData.signedUrl,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

