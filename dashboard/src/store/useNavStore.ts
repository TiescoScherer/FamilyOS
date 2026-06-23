import { create } from "zustand";

export type Page =
  | "dashboard"
  | "familia"
  | "financeiro"
  | "calendario"
  | "saude"
  | "compras"
  | "metas";

interface NavStore {
  page: Page;
  go: (p: Page) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  page: "dashboard",
  go: (page) => set({ page }),
}));
