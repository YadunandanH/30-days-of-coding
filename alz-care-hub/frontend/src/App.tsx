import { useEffect, useMemo, useState } from "react";

import { AppLayout } from "./components/AppLayout";
import { ChatAssistant } from "./components/ChatAssistant";
import { RoleProvider, useRole, Role } from "./context/RoleContext";
import { RoleSwitcher } from "./components/RoleSwitcher";
import { PatientHome } from "./pages/PatientHome";
import { PatientSafety } from "./pages/PatientSafety";
import { MemoryExercises } from "./pages/MemoryExercises";
import { CaregiverDashboard } from "./pages/CaregiverDashboard";
import { HcpTriage } from "./pages/HcpTriage";
import { HcoTerritory } from "./pages/HcoTerritory";
import { Reporting } from "./pages/Reporting";

type Tab = {
  id: string;
  label: string;
  component: JSX.Element;
};

const tabsByRole: Record<Role, Tab[]> = {
  patient: [
    { id: "home", label: "Home / Today", component: <PatientHome /> },
    { id: "safety", label: "Safety & SOS", component: <PatientSafety /> },
    { id: "memory", label: "Memory exercises", component: <MemoryExercises /> },
  ],
  caregiver: [
    { id: "dashboard", label: "Dashboard", component: <CaregiverDashboard /> },
  ],
  hcp: [
    { id: "triage", label: "Triage board", component: <HcpTriage /> },
  ],
  hco_admin: [
    { id: "territory", label: "Territory", component: <HcoTerritory /> },
    { id: "reporting", label: "Reporting", component: <Reporting /> },
  ],
};

const AppContent = () => {
  const { role } = useRole();
  const tabs = useMemo(() => tabsByRole[role], [role]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  useEffect(() => {
    setActiveTab(tabs[0].id);
  }, [tabs]);

  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <AppLayout>
      <RoleSwitcher />
      <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", alignItems: "start" }}>
        <div>
          <nav className="tab-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={tab.id === activeTab ? "active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div>{activeTabConfig.component}</div>
        </div>
        <ChatAssistant role={role} />
      </div>
    </AppLayout>
  );
};

const App = () => (
  <RoleProvider>
    <AppContent />
  </RoleProvider>
);

export default App;
