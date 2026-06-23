import { useEffect } from "react";
import { useNavStore } from "@/store/useNavStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { FamilyDashboard } from "@/components/family/FamilyDashboard";
import { FamilyPage } from "@/pages/FamilyPage";
import { FinancialPage } from "@/pages/FinancialPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useFinancialStore } from "@/store/useFinancialStore";

function Placeholder({ titulo, icon }: { titulo: string; icon: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "var(--text-muted)" }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>{titulo}</p>
      <p style={{ fontSize: 13 }}>Em construção</p>
    </div>
  );
}

function PageContent() {
  const page = useNavStore((s) => s.page);
  switch (page) {
    case "dashboard":  return <FamilyDashboard />;
    case "familia":    return <FamilyPage />;
    case "financeiro": return <FinancialPage />;
    case "calendario": return <CalendarPage />;
    case "saude":      return <Placeholder titulo="Saúde" icon="💊" />;
    case "compras":    return <Placeholder titulo="Lista de Compras" icon="🛒" />;
    case "metas":      return <Placeholder titulo="Metas" icon="🎯" />;
    default:           return <FamilyDashboard />;
  }
}

export function App() {
  const loadFamily = useFamilyStore((s) => s.loadAll);
  const loadFinancial = useFinancialStore((s) => s.loadAll);

  useEffect(() => {
    loadFamily();
    loadFinancial();
  }, [loadFamily, loadFinancial]);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <PageContent />
      </main>
    </div>
  );
}

