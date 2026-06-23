export interface CreditCard {
  id: string;
  nome: string;
  bandeira: "visa" | "mastercard" | "elo" | "amex" | "outro";
  titular: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  gastoMes: number;
}

export interface BudgetCategory {
  id: string;
  nome: string;
  icon: string;
  limite: number;
  gasto: number;
  cor: string;
}

export interface Transacao {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  membro?: string;
  cartaoId?: string;
  origem: "manual" | "audio" | "foto" | "importacao";
}

export interface ContaFixa {
  id: string;
  nome: string;
  valor: number;
  vencimento: number;
  categoria: string;
  paga: boolean;
}
