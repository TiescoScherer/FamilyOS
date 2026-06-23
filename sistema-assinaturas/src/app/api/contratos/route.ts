import { NextResponse } from 'next/server';
import { getContratos } from '../db';

export async function GET() {
  try {
    const contratos = getContratos();
    // Retorna ordenado por data de criação mais recente
    const sorted = [...contratos].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return NextResponse.json({ success: true, contratos: sorted });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro ao listar contratos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
