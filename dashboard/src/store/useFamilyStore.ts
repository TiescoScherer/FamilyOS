import { create } from "zustand";
import type {
  FamilyMember,
  MedicationRoutine,
  FinancialRecord,
  FutureGoal,
  ShoppingItem,
} from "@/types/family";
import {
  fetchFamilyMembers,
  fetchMedications,
  fetchGoals,
  fetchShopping,
  addMedication,
  addGoal,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  updateFamilyMember
} from "@/lib/services";

interface FamilyStore {
  members: FamilyMember[];
  medications: MedicationRoutine[];
  financials: FinancialRecord[];
  goals: FutureGoal[];
  shopping: ShoppingItem[];
  carregando: boolean;

  loadAll: () => Promise<void>;
  
  updateMember: (id: string, dados: any) => Promise<void>;

  addRemedio: (m: Omit<MedicationRoutine, "id">) => Promise<void>;

  addMeta: (g: Omit<FutureGoal, "id">) => Promise<void>;

  addCompra: (s: Omit<ShoppingItem, "id">) => Promise<void>;
  toggleCompra: (id: string) => Promise<void>;
  removeCompra: (id: string) => Promise<void>;

  setMembers: (m: FamilyMember[]) => void;
  setMedications: (m: MedicationRoutine[]) => void;
  setFinancials: (f: FinancialRecord[]) => void;
  setGoals: (g: FutureGoal[]) => void;
  setShopping: (s: ShoppingItem[]) => void;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  members: [],
  medications: [],
  financials: [],
  goals: [],
  shopping: [],
  carregando: false,

  loadAll: async () => {
    set({ carregando: true });
    try {
      const [members, medications, goals, shopping] = await Promise.all([
        fetchFamilyMembers(),
        fetchMedications(),
        fetchGoals(),
        fetchShopping()
      ]);

      set({ members, medications, goals, shopping });
    } catch (err) {
      console.error("Erro ao carregar dados da família:", err);
    } finally {
      set({ carregando: false });
    }
  },

  updateMember: async (id, dados) => {
    await updateFamilyMember(id, dados);
    // Recarregar os membros com os novos perfis de saúde
    const members = await fetchFamilyMembers();
    set({ members });
  },

  addRemedio: async (m) => {
    const novo = await addMedication(m);
    if (novo) {
      const medications = await fetchMedications(); // Recarrega para obter o nome do membro mapeado
      set({ medications });
    }
  },

  addMeta: async (g) => {
    const nova = await addGoal(g);
    if (nova) {
      set((s) => ({ goals: [...s.goals, { ...nova, valor_alvo: Number(nova.valor_alvo), valor_atual: Number(nova.valor_atual) }] }));
    }
  },

  addCompra: async (compra) => {
    const nova = await addShoppingItem(compra);
    if (nova) {
      const shopping = await fetchShopping(); // Recarrega para obter o nome do membro mapeado
      set({ shopping });
    }
  },

  toggleCompra: async (id) => {
    const item = get().shopping.find((x) => x.id === id);
    if (item) {
      const comprado = !item.comprado;
      await toggleShoppingItem(id, comprado);
      set((s) => ({
        shopping: s.shopping.map((x) => x.id === id ? { ...x, comprado } : x)
      }));
    }
  },

  removeCompra: async (id) => {
    await deleteShoppingItem(id);
    set((s) => ({ shopping: s.shopping.filter((x) => x.id !== id) }));
  },

  setMembers: (members) => set({ members }),
  setMedications: (medications) => set({ medications }),
  setFinancials: (financials) => set({ financials }),
  setGoals: (goals) => set({ goals }),
  setShopping: (shopping) => set({ shopping }),
}));
