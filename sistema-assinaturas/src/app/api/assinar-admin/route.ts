import { NextResponse } from 'next/server';
import { getContratos, saveContratos } from '../db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { token_acesso } = await req.json();

    if (!token_acesso) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 400 });
    }

    const contratos = getContratos();
    const index = contratos.findIndex(c => c.token_acesso === token_acesso);

    if (index === -1) {
      return NextResponse.json({ error: 'Contrato não encontrado.' }, { status: 404 });
    }

    const contrato = contratos[index];

    if (contrato.status !== 'assinado_cliente') {
      return NextResponse.json({ 
        error: 'O cliente precisa assinar o contrato antes da assinatura da empresa.' 
      }, { status: 400 });
    }

    // Coleta evidências da empresa/testemunha
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1 (IP Admin)';
    const userAgent = req.headers.get('user-agent') || 'Painel Admin Filara';
    const timestamp = new Date().toISOString();

    // Hash único combinando a assinatura do cliente + carimbo da empresa
    const hashData = `${token_acesso}-${contrato.evidencias_cliente?.hash}-${ip}-${timestamp}-FILARA-ADMIN`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');

    contratos[index] = {
      ...contrato,
      status: 'assinado_total',
      evidencias_admin: {
        ip,
        userAgent,
        timestamp,
        hash
      }
    };

    saveContratos(contratos);

    return NextResponse.json({ 
      success: true, 
      hash, 
      timestamp,
      contrato: contratos[index] 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
