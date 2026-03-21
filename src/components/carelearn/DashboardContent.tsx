import { FileText, Users, CheckCircle2, AlertCircle, MoreVertical } from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";
import { Training, StaffMember, LANGUAGES } from "@/data/carelearn-data";

interface DashboardContentProps {
  trainings: Training[];
  staff: StaffMember[];
  loading?: boolean;
}

export function DashboardContent({ trainings, staff, loading }: DashboardContentProps) {
  const totalAssigned = staff.reduce((sum, s) => sum + s.assigned, 0);
  const totalCompleted = staff.reduce((sum, s) => sum + s.completed, 0);
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
  const overdueCount = trainings.filter((t) => t.status === "Overdue").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-4 gap-6">
        <StatCard label="Total Trainings" value={String(trainings.length)} icon={<FileText className="text-primary" size={20} />} />
        <StatCard label="Staff Assigned" value={String(totalAssigned)} icon={<Users className="text-blue-600" size={20} />} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={<CheckCircle2 className="text-success" size={20} />} />
        <StatCard label="Overdue" value={String(overdueCount)} icon={<AlertCircle className="text-destructive" size={20} />} />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-sm">
              <th className="px-6 py-4 font-medium">Training Title</th>
              <th className="px-6 py-4 font-medium">Languages</th>
              <th className="px-6 py-4 font-medium text-center">Assigned</th>
              <th className="px-6 py-4 font-medium text-center">Completed</th>
              <th className="px-6 py-4 font-medium">Due Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {trainings.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/50 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{t.title}</td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-1">
                    {t.langs.map((l) => {
                      const lang = LANGUAGES.find((lg) => lg.code === l);
                      return (
                        <span key={l} title={lang?.label} className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-xs">
                          {lang?.flag}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 text-center tabular-nums">{t.assigned}</td>
                <td className="px-6 py-4 text-center tabular-nums">{t.completed}</td>
                <td className="px-6 py-4 text-muted-foreground text-sm">{t.due}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={t.status === "Overdue" ? "error" : t.status === "Draft" ? "default" : "active"}>
                    {t.status}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 hover:bg-secondary rounded text-muted-foreground">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
