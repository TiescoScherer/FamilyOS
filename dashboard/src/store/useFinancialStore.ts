import { create } from "zustand";
import type { CreditCard, BudgetCategory, Transacao, ContaFixa } from "@/types/financial";
import {
  fetchFinancials,
  addFinancial,
  deleteFinancial,
  fetchFixedBills,
  addFixedBill,
  toggleFixedBill,
  deleteFixedBill,
  fetchCreditCards,
  addCreditCard,
  deleteCreditCard
} from "@/lib/services";

interface FinancialStore {
  cartoes: CreditCard[];
  budgets: BudgetCategory[];
  transacoes: Transacao[];
  contasFixas: ContaFixa[];
  carregando: boolean;

  loadAll: () => Promise<void>;

  addCartao: (c: Omit<CreditCard, "id">) => Promise<void>;
  removeCartao: (id: string) => Promise<void>;

  addTransacao: (t: Omit<Transacao, "id">) => Promise<void>;
  removeTransacao: (id: string) => Promise<void>;

  addContaFixa: (c: Omit<ContaFixa, "id">) => Promise<void>;
  toggleContaFixa: (id: string) => Promise<void>;
  removeContaFixa: (id: string) => Promise<void>;
}

const BUDGET_DEFAULTS: BudgetCategory[] = [
  { id: "1", nome: "Alimentação",  icon: "🛒", limite: 1500, gasto: 0, cor: "#22C55E" },
  { id: "2", nome: "Saúde",        icon: "💊", limite: 500,  gasto: 0, cor: "#EC4899" },
  { id: "3", nome: "Educação",     icon: "📚", limite: 800,  gasto: 0, cor: "#6C63FF" },
  { id: "4", nome: "Transporte",   icon: "🚗", limite: 400,  gasto: 0, cor: "#F59E0B" },
  { id: "5", nome: "Lazer",        icon: "🎉", limite: 300,  gasto: 0, cor: "#06B6D4" },
  { id: "6", nome: "Moradia",      icon: "🏠", limite: 2000, gasto: 0, cor: "#8B5CF6" },
];

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  cartoes: [],
  budgets: BUDGET_DEFAULTS,
  transacoes: [],
  contasFixas: [],
  carregando: false,

  loadAll: async () => {
    set({ carregando: true });
    try {
      const [transacoes, contasFixas, cartoes] = await Promise.all([
        fetchFinancials(),
        fetchFixedBills(),
        fetchCreditCards()
      ]);

      // Recalcular os gastos de orçamento baseados nas transações despesa do mês atual
      const mesAtual = new Date().toISOString().slice(0, 7);
      const budgets = BUDGET_DEFAULTS.map((b) => {
        const gasto = transacoes
          .filter((t) => t.tipo === "despesa" && t.categoria === b.nome && t.data.startsWith(mesAtual))
          .reduce((sum, t) => sum + t.valor, 0);
        return { ...b, gasto };
      });

      // Recalcular gastos dos cartões de crédito
      const cartoesComGastos = cartoes.map((c) => {
        const gastoMes = transacoes
          .filter((t) => t.tipo === "despesa" && t.cartaoId === c.id && t.data.startsWith(mesAtual))
          .reduce((sum, t) => sum + t.valor, 0);
        return { ...c, gastoMes };
      });

      set({ transacoes, contasFixas, cartoes: cartoesComGastos, budgets });
    } catch (err) {
      console.error("Erro ao carregar dados financeiros:", err);
    } finally {
      set({ carregando: false });
    }
  },

  addCartao: async (c) => {
    const novo = await addCreditCard({ ...c, gastoMes: 0 });
    if (novo) {
      set((s) => ({ cartoes: [...s.cartoes, novo] }));
    }
  },

  removeCartao: async (id) => {
    await deleteCreditCard(id);
    set((s) => ({ cartoes: s.cartoes.filter((x) => x.id !== id) }));
  },

  addTransacao: async (t) => {
    const salva = await addFinancial(t);
    if (salva) {
      const transacaoCompleta: Transacao = {
        id: salva.id,
        tipo: salva.tipo,
        descricao: salva.descricao,
        valor: Number(salva.valor),
        categoria: salva.categoria,
        data: salva.data,
        membro: t.membro,
        cartaoId: t.cartaoId,
        origem: t.origem || "manual"
      };

      set((s) => {
        const budgets = s.budgets.map((b) =>
          transacaoCompleta.tipo === "despesa" && b.nome === transacaoCompleta.categoria
            ? { ...b, gasto: b.gasto + transacaoCompleta.valor }
            : b
        );
        const cartoes = transacaoCompleta.cartaoId
          ? s.cartoes.map((c) => c.id === transacaoCompleta.cartaoId ? { ...c, gastoMes: c.gastoMes + transacaoCompleta.valor } : c)
          : s.cartoes;
        return { transacoes: [transacaoCompleta, ...s.transacoes], budgets, cartoes };
      });
    }
  },

  removeTransacao: async (id) => {
    const t = get().transacoes.find((x) => x.id === id);
    await deleteFinancial(id);
    set((s) => {
      const transacoes = s.transacoes.filter((x) => x.id !== id);
      if (!t) return { transacoes };

      const budgets = s.budgets.map((b) =>
        t.tipo === "despesa" && b.nome === t.categoria
          ? { ...b, gasto: Math.max(0, b.gasto - t.valor) }
          : b
      );
      const cartoes = t.cartaoId
        ? s.cartoes.map((c) => c.id === t.cartaoId ? { ...c, gastoMes: Math.max(0, c.gastoMes - t.valor) } : c)
        : s.cartoes;

      return { transacoes, budgets, cartoes };
    });
  },

  addContaFixa: async (c) => {
    const nova = await addFixedBill(c);
    if (nova) {
      set((s) => ({ contasFixas: [...s.contasFixas, nova] }));
    }
  },

  toggleContaFixa: async (id) => {
    const c = get().contasFixas.find((x) => x.id === id);
    if (c) {
      const novaPaga = !c.paga;
      await toggleFixedBill(id, novaPaga);
      set((s) => ({
        contasFixas: s.contasFixas.map((x) => x.id === id ? { ...x, paga: novaPaga } : x)
      }));
    }
  },

  removeContaFixa: async (id) => {
    await deleteFixedBill(id);
    set((s) => ({ contasFixas: s.contasFixas.filter((c) => c.id !== id) }));
  },
}));
