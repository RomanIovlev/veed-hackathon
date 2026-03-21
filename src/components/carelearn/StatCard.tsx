import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-soft p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-secondary rounded-lg">{icon}</div>
      </div>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
    </div>
  );
}
