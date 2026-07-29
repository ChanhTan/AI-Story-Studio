import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Image,
  Volume2,
  Video,
  History,
  Eye,
  Terminal,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "script", label: "Script", icon: <FileText size={18} /> },
  { id: "images", label: "Images", icon: <Image size={18} /> },
  { id: "voices", label: "Voices", icon: <Volume2 size={18} /> },
  { id: "render", label: "Render", icon: <Video size={18} /> },
  { id: "preview", label: "Preview", icon: <Eye size={18} /> },
  { id: "logs", label: "Logs", icon: <Terminal size={18} /> },
  { id: "history", label: "History", icon: <History size={18} /> },
  { id: "settings", label: "Settings", icon: <Settings size={18} /> },
];

interface LayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        className={cn(
          "flex flex-col border-r border-border bg-card/50 backdrop-blur-xl",
          "shrink-0 overflow-hidden"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-sm whitespace-nowrap"
              >
                AI Story Studio
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                activeTab === item.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {item.icon}
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full h-8 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft size={16} />
            </motion.div>
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
