export interface FamilyMember {
  id: string;
  nome: string;
  role: "admin" | "filho";
  data_nascimento: string;
  avatar_url?: string;
}

export interface MedicationRoutine {
  id: string;
  member_id: string;
  member_nome?: string;
  nome_remedio: string;
  dosagem: string;
  frequencia_horas: number;
  horario_inicio: string;
  status_ativo: boolean;
}

export interface FinancialRecord {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface FutureGoal {
  id: string;
  titulo: string;
  descricao?: string;
  valor_alvo: number;
  valor_atual: number;
  prazo?: string;
  categoria?: string;
  status: "em_andamento" | "concluida" | "pausada";
}

export interface ShoppingItem {
  id: string;
  item: string;
  categoria?: string;
  quantidade: number;
  comprado: boolean;
  urgente: boolean;
  member_nome?: string;
}

// Evento da timeline gerado a partir de medications_routines
export interface TimelineEvent {
  hora: string;
  titulo: string;
  subtitulo: string;
  tipo: "remedio" | "meta" | "compra";
  urgente?: boolean;
}
