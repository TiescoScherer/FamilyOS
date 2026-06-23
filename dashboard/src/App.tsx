import { useEffect } from "react";
import { useNavStore } from "@/store/useNavStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Sidebar } from "@/components/layout/Sidebar";
import { FamilyDashboard } from "@/components/family/FamilyDashboard";
import { FamilyPage } from "@/pages/FamilyPage";
import { FinancialPage } from "@/pages/FinancialPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { HealthPage } from "@/pages/HealthPage";
import { ShoppingPage } from "@/pages/ShoppingPage";
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
    case "saude":      return <HealthPage />;
    case "compras":    return <ShoppingPage />;
    case "metas":      return <Placeholder titulo="Metas" icon="🎯" />;
    default:           return <FamilyDashboard />;
  }
}

export function App() {
  const loadFamily = useFamilyStore((s) => s.loadAll);
  const loadFinancial = useFinancialStore((s) => s.loadAll);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadFamily();
    loadFinancial();
  }, [loadFamily, loadFinancial]);

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", height: "100%", width: "100%", overflow: "hidden" }}>
      {!isMobile && <Sidebar />}
      <main style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingBottom: isMobile ? 64 : 0,
      }}>
        <PageContent />
      </main>
      {isMobile && <Sidebar />}
    </div>
  );
}
