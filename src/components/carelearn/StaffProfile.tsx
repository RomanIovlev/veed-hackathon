import { X, Mail, Globe, Clock, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { StaffMember, Training, LANGUAGES } from "@/data/carelearn-data";
import { StatusBadge } from "./StatusBadge";

interface StaffProfileProps {
  member: StaffMember;
  trainings: Training[];
  onClose: () => void;
}

export function StaffProfile({ member, trainings, onClose }: StaffProfileProps) {
  const langInfo = LANGUAGES.find((l) => l.code === member.lang);
  const completionPct = member.assigned > 0 ? Math.round((member.completed / member.assigned) * 100) : 0;

  // Simulate which trainings are assigned to this member
  const assignedTrainings = trainings.map((t, i) => {
    const isCompleted = i < member.completed;
    const isOverdue = !isCompleted && t.status === "Overdue";
    return { ...t, memberStatus: isCompleted ? "Completed" as const : isOverdue ? "Overdue" as const : "Pending" as const };
  });

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-lg max-h-[90vh] overflow-hidden animate-zoom-in flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                {member.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Mail size={12} />
                Email
              </div>
              <p className="text-sm font-medium text-foreground truncate">{member.email}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Globe size={12} />
                Language
              </div>
              <p className="text-sm font-medium text-foreground">{member.flag} {langInfo?.label}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <Clock size={12} />
                Last Active
              </div>
              <p className="text-sm font-medium text-foreground">{member.lastActive}</p>
            </div>
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
                <BookOpen size={12} />
                Completion
              </div>
              <p className="text-sm font-medium text-foreground">{completionPct}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-foreground">Training Progress</span>
              <span className="tabular-nums text-muted-foreground">{member.completed}/{member.assigned} completed</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completionPct === 100 ? "bg-success" : "bg-primary"}`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Assigned trainings */}
          <div>
            <h3 className="font-bold text-foreground mb-3">Assigned Trainings</h3>
            <div className="space-y-2">
              {assignedTrainings.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    t.memberStatus === "Completed" ? "bg-success/10 text-success" :
                    t.memberStatus === "Overdue" ? "bg-destructive/10 text-destructive" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {t.memberStatus === "Completed" ? <CheckCircle2 size={16} /> :
                     t.memberStatus === "Overdue" ? <AlertCircle size={16} /> :
                     <BookOpen size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {t.due}</p>
                  </div>
                  <StatusBadge
                    variant={t.memberStatus === "Completed" ? "success" : t.memberStatus === "Overdue" ? "error" : "default"}
                  >
                    {t.memberStatus}
                  </StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
