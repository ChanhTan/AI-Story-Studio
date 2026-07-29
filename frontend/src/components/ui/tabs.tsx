import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}
const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 p-1 rounded-lg bg-secondary/50", className)}>
      {children}
    </div>
  );
}

function TabsTrigger({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx?.value === value;

  return (
    <button
      onClick={() => ctx?.onValueChange(value)}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

function TabsContent({
  children,
  value,
  className,
}: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) {
  const ctx = React.useContext(TabsContext);
  if (ctx?.value !== value) return null;

  return <div className={className}>{children}</div>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
