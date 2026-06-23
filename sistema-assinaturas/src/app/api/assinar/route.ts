import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getContratos, updateContrato } from '../db';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializa condicionalmente para não quebrar a execução se o .env não estiver pronto
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(req: Request) {
  try {
    const { token_acesso } = await req.json();

    if (!token_acesso) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    // 1. Grava no banco de dados JSON local
    const contratos = getContratos();
    const contratoLocal = contratos.find(c => c.token_acesso === token_acesso);

    if (contratoLocal) {
      console.log(`[BANCO LOCAL] Processando assinatura do cliente para o token: ${token_acesso}`);

      if (contratoLocal.status === 'assinado_cliente' || contratoLocal.status === 'assinado_total') {
        return NextResponse.json({ error: 'Este contrato já foi assinado.' }, { status: 409 });
      }

      if (contratoLocal.status === 'pendente') {
        return NextResponse.json({ error: 'Você precisa visualizar o contrato antes de assinar.' }, { status: 403 });
      }

      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1 (IP Cliente Teste)';
      const userAgent = req.headers.get('user-agent') || 'Navegador de Teste Cliente';
      const timestamp = new Date().toISOString();

      const hashData = `${token_acesso}-${ip}-${timestamp}-FILARA-MOCK-CLIENTE`;
      const hash_documento = crypto.createHash('sha256').update(hashData).digest('hex');

      updateContrato(token_acesso, {
        status: 'assinado_cliente',
        evidencias_cliente: {
          ip,
          userAgent,
          timestamp,
          hash: hash_documento
        }
      });

      return NextResponse.json({
        success: true,
        hash: hash_documento,
        timestamp,
      });
    }

    // --- MODO FALLBACK SE NÃO ACHAR LOCAL ---
    if (!supabase) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    // Verifica se o contrato existe e foi visualizado antes de assinar no Supabase
    const { data: contrato, error: fetchError } = await supabase
      .from('contratos')
      .select('id, status, cliente_nome')
      .eq('token_acesso', token_acesso)
      .single();

    if (fetchError || !contrato) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    if (contrato.status === 'assinado') {
      return NextResponse.json({ error: 'Este contrato já foi assinado.' }, { status: 409 });
    }

    if (contrato.status === 'pendente') {
      return NextResponse.json({ error: 'Você precisa visualizar o contrato antes de assinar.' }, { status: 403 });
    }

    // [SEGURANÇA E VALIDADE JURÍDICA] Captura evidências de autoria
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'IP Desconhecido';
    const userAgent = req.headers.get('user-agent') || 'Navegador Desconhecido';
    const timestamp = new Date().toISOString();

    const evidencias = {
      ip,
      userAgent,
      timestamp,
      aceitou_termos: true,
      assinado_por: contrato.cliente_nome,
    };

    // Gera o Hash SHA-256
    const hashData = `${token_acesso}-${ip}-${timestamp}-FILARA`;
    const hash_documento = crypto.createHash('sha256').update(hashData).digest('hex');

    // [RESILIÊNCIA] Atualização atômica
    const { error: updateError } = await supabase
      .from('contratos')
      .update({
        status: 'assinado',
        evidencias_assinatura: evidencias,
        hash_documento,
      })
      .eq('token_acesso', token_acesso)
      .eq('status', 'visualizado');

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, hash: hash_documento, timestamp });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: 'Ocorreu um erro ao processar sua assinatura. Tente novamente.' }, { status: 500 });
  }
}

