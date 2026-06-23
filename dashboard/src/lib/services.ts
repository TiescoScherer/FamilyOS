import { supabase } from "./supabase";
import type { FamilyMember, MedicationRoutine, FutureGoal, ShoppingItem } from "@/types/family";
import type { Transacao, ContaFixa, CreditCard } from "@/types/financial";

// ── AUXILIAR: Mapear nome de membro para UUID ──
export async function getMemberIdByNome(nome: string): Promise<string | null> {
  if (!nome || nome === "Família") return null;
  const { data } = await supabase
    .from("family_members")
    .select("id")
    .eq("nome", nome)
    .single();
  return data?.id || null;
}

// ── MEMBROS DA FAMÍLIA & SAÚDE ──
export async function fetchFamilyMembers() {
  const { data: members, error } = await supabase
    .from("family_members")
    .select(`
      *,
      health_profiles (
        alergias,
        tipo_sanguineo,
        contato_pediatra,
        observacoes
      )
    `);

  if (error) {
    console.error("Erro ao buscar membros:", error);
    return [];
  }
  return members;
}

export async function updateFamilyMember(memberId: string, dados: any) {
  // Atualiza dados na tabela family_members
  const { error: memberError } = await supabase
    .from("family_members")
    .update({
      nome: dados.nome,
      role: dados.role,
      data_nascimento: dados.dataNascimento
    })
    .eq("id", memberId);

  if (memberError) console.error("Erro ao atualizar membro:", memberError);

  // Atualiza ou insere dados na tabela health_profiles
  const { data: profile } = await supabase
    .from("health_profiles")
    .select("id")
    .eq("member_id", memberId)
    .single();

  const profileData = {
    alergias: dados.alergias,
    tipo_sanguineo: dados.tipoSanguineo,
    contato_pediatra: dados.pediatra,
    observacoes: dados.cirurgias
  };

  if (profile) {
    const { error: profileError } = await supabase
      .from("health_profiles")
      .update(profileData)
      .eq("member_id", memberId);
    if (profileError) console.error("Erro ao atualizar perfil de saúde:", profileError);
  } else {
    const { error: profileError } = await supabase
      .from("health_profiles")
      .insert({ member_id: memberId, ...profileData });
    if (profileError) console.error("Erro ao inserir perfil de saúde:", profileError);
  }
}

// ── REMÉDIOS ──
export async function fetchMedications() {
  const { data, error } = await supabase
    .from("medications_routines")
    .select(`
      *,
      family_members (
        nome
      )
    `);

  if (error) {
    console.error("Erro ao buscar remédios:", error);
    return [];
  }

  return data.map((med: any) => ({
    id: med.id,
    member_id: med.member_id,
    member_nome: med.family_members?.nome || "filho",
    nome_remedio: med.nome_remedio,
    dosagem: med.dosagem,
    frequencia_horas: med.frequencia_horas,
    horario_inicio: med.horario_inicio.slice(0, 5), // Remove segundos se houver
    status_ativo: med.status_ativo
  }));
}

export async function addMedication(med: Omit<MedicationRoutine, "id">) {
  const { data, error } = await supabase
    .from("medications_routines")
    .insert({
      member_id: med.member_id,
      nome_remedio: med.nome_remedio,
      dosagem: med.dosagem,
      frequencia_horas: med.frequencia_horas,
      horario_inicio: med.horario_inicio,
      status_ativo: med.status_ativo
    })
    .select()
    .single();

  if (error) console.error("Erro ao adicionar remédio:", error);
  return data;
}

// ── TRANSAÇÕES FINANCEIRAS ──
export async function fetchFinancials(): Promise<Transacao[]> {
  const { data, error } = await supabase
    .from("financial_records")
    .select(`
      *,
      family_members (
        nome
      )
    `)
    .order("data", { ascending: false });

  if (error) {
    console.error("Erro ao buscar registros financeiros:", error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    tipo: r.tipo,
    descricao: r.descricao,
    valor: Number(r.valor),
    categoria: r.categoria,
    data: r.data,
    membro: r.family_members?.nome || "Família",
    origem: "manual"
  }));
}

export async function addFinancial(t: Omit<Transacao, "id">) {
  const memberId = t.membro ? await getMemberIdByNome(t.membro) : null;
  const { data, error } = await supabase
    .from("financial_records")
    .insert({
      tipo: t.tipo,
      descricao: t.descricao,
      valor: t.valor,
      categoria: t.categoria,
      data: t.data,
      member_id: memberId
    })
    .select()
    .single();

  if (error) console.error("Erro ao salvar transação:", error);
  return data;
}

export async function deleteFinancial(id: string) {
  const { error } = await supabase
    .from("financial_records")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar transação:", error);
}

// ── METAS FUTURAS ──
export async function fetchGoals(): Promise<FutureGoal[]> {
  const { data, error } = await supabase
    .from("future_goals")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar metas:", error);
    return [];
  }

  return data.map((g: any) => ({
    id: g.id,
    titulo: g.titulo,
    descricao: g.descricao,
    valor_alvo: Number(g.valor_alvo),
    valor_atual: Number(g.valor_atual),
    prazo: g.prazo,
    categoria: g.categoria,
    status: g.status
  }));
}

export async function addGoal(g: Omit<FutureGoal, "id">) {
  const { data, error } = await supabase
    .from("future_goals")
    .insert({
      titulo: g.titulo,
      descricao: g.descricao,
      valor_alvo: g.valor_alvo,
      valor_atual: g.valor_atual,
      prazo: g.prazo,
      categoria: g.categoria,
      status: g.status
    })
    .select()
    .single();

  if (error) console.error("Erro ao adicionar meta:", error);
  return data;
}

// ── LISTA DE COMPRAS ──
export async function fetchShopping(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_list")
    .select(`
      *,
      family_members (
        nome
      )
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar itens de compras:", error);
    return [];
  }

  return data.map((s: any) => ({
    id: s.id,
    item: s.item,
    categoria: s.categoria,
    quantidade: s.quantidade,
    comprado: s.comprado,
    urgente: s.urgente,
    member_nome: s.family_members?.nome
  }));
}

export async function addShoppingItem(s: Omit<ShoppingItem, "id">) {
  const memberId = s.member_nome ? await getMemberIdByNome(s.member_nome) : null;
  const { data, error } = await supabase
    .from("shopping_list")
    .insert({
      item: s.item,
      categoria: s.categoria,
      quantidade: s.quantidade,
      comprado: s.comprado,
      urgente: s.urgente,
      member_id: memberId
    })
    .select()
    .single();

  if (error) console.error("Erro ao adicionar item de compra:", error);
  return data;
}

export async function toggleShoppingItem(id: string, comprado: boolean) {
  const { error } = await supabase
    .from("shopping_list")
    .update({ comprado })
    .eq("id", id);

  if (error) console.error("Erro ao atualizar item de compra:", error);
}

export async function deleteShoppingItem(id: string) {
  const { error } = await supabase
    .from("shopping_list")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar item de compra:", error);
}

// ── CARTÕES DE CRÉDITO ──
export async function fetchCreditCards(): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from("credit_cards")
    .select("*");

  if (error) {
    console.error("Erro ao buscar cartões de crédito:", error);
    return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    nome: c.nome,
    bandeira: c.bandeira,
    titular: c.titular,
    limite: Number(c.limite),
    diaFechamento: c.dia_fechamento,
    diaVencimento: c.dia_vencimento,
    cor: c.cor,
    gastoMes: Number(c.gasto_mes)
  }));
}

export async function addCreditCard(c: Omit<CreditCard, "id">) {
  const { data, error } = await supabase
    .from("credit_cards")
    .insert({
      nome: c.nome,
      bandeira: c.bandeira,
      titular: c.titular,
      limite: c.limite,
      dia_fechamento: c.diaFechamento,
      dia_vencimento: c.diaVencimento,
      cor: c.cor,
      gasto_mes: c.gastoMes
    })
    .select()
    .single();

  if (error) console.error("Erro ao adicionar cartão:", error);
  return data;
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase
    .from("credit_cards")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar cartão:", error);
}

// ── CONTAS FIXAS ──
export async function fetchFixedBills(): Promise<ContaFixa[]> {
  const { data, error } = await supabase
    .from("fixed_bills")
    .select("*");

  if (error) {
    console.error("Erro ao buscar contas fixas:", error);
    return [];
  }

  return data.map((f: any) => ({
    id: f.id,
    nome: f.nome,
    valor: Number(f.valor),
    vencimento: f.vencimento,
    categoria: f.categoria,
    paga: f.paga
  }));
}

export async function addFixedBill(b: Omit<ContaFixa, "id">) {
  const { data, error } = await supabase
    .from("fixed_bills")
    .insert({
      nome: b.nome,
      valor: b.valor,
      vencimento: b.vencimento,
      categoria: b.categoria,
      paga: b.paga
    })
    .select()
    .single();

  if (error) console.error("Erro ao adicionar conta fixa:", error);
  return data;
}

export async function toggleFixedBill(id: string, paga: boolean) {
  const { error } = await supabase
    .from("fixed_bills")
    .update({ paga })
    .eq("id", id);

  if (error) console.error("Erro ao atualizar conta fixa:", error);
}

export async function deleteFixedBill(id: string) {
  const { error } = await supabase
    .from("fixed_bills")
    .delete()
    .eq("id", id);

  if (error) console.error("Erro ao deletar conta fixa:", error);
}
