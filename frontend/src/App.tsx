import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { ScriptEditor } from "@/pages/ScriptEditor";
import { SettingsPage } from "@/pages/SettingsPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { PreviewPage } from "@/pages/PreviewPage";
import { ImagesPage } from "@/pages/ImagesPage";
import { VoicesPage } from "@/pages/VoicesPage";
import { RenderPage } from "@/pages/RenderPage";
import { LogsPage } from "@/pages/LogsPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "script":
        return <ScriptEditor />;
      case "settings":
        return <SettingsPage />;
      case "history":
        return <HistoryPage />;
      case "preview":
        return <PreviewPage />;
      case "images":
        return <ImagesPage />;
      case "voices":
        return <VoicesPage />;
      case "render":
        return <RenderPage />;
      case "logs":
        return <LogsPage />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderPage()}
    </Layout>
  );
}
