import { useState } from "react";
import { LayoutDashboard, Users, CheckCircle2, Plus, Palette } from "lucide-react";
import { DashboardContent } from "./DashboardContent";
import { StaffContent } from "./StaffContent";
import { CreateTrainingFlow } from "./CreateTrainingFlow";
import { BrandingKnowledge } from "./BrandingKnowledge";
import { Training, StaffMember } from "@/data/carelearn-data";

interface ManagerPortalProps {
  trainings: Training[];
  staff: StaffMember[];
  onAddTraining: (training: Training) => void;
  onAddStaff: (staff: StaffMember) => void;
  onRefreshTrainings?: () => void;
  loading?: boolean;
}

function NavItem({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ManagerPortal({ trainings, staff, onAddTraining, onAddStaff, onRefreshTrainings, loading }: ManagerPortalProps) {
  const [tab, setTab] = useState<"dashboard" | "staff" | "branding">("dashboard");
  const [isCreating, setIsCreating] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);

  if (isCreating || editingDocumentId) {
    return (
      <CreateTrainingFlow
        staff={staff}
        onBack={() => {
          setIsCreating(false);
          setEditingDocumentId(null);
          // Refresh trainings when coming back from create/edit
          onRefreshTrainings?.();
        }}
        onPublish={onAddTraining}
        editingDocumentId={editingDocumentId}
      />
    );
  }

  const titles: Record<string, string> = {
    dashboard: "Training Overview",
    staff: "Staff Directory",
    branding: "Branding & Knowledge",
  };

  const subtitles: Record<string, string> = {
    dashboard: "Manage your facility's compliance and education.",
    staff: "Manage your team members and their progress.",
    branding: "Upload company assets and documentation for AI-personalised content.",
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            <CheckCircle2 size={20} />
          </div>
          <span className="font-bold text-xl tracking-display">CareLearn</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem active={tab === "dashboard"} onClick={() => setTab("dashboard")} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem active={tab === "staff"} onClick={() => setTab("staff")} icon={<Users size={18} />} label="Staff Management" />
          <NavItem active={tab === "branding"} onClick={() => setTab("branding")} icon={<Palette size={18} />} label="Branding & Knowledge" />
        </nav>

        <div className="pt-6 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">A</div>
          <div className="text-sm">
            <p className="font-medium text-foreground">Admin User</p>
            <p className="text-muted-foreground text-xs">Facility Manager</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-10 max-w-6xl mx-auto w-full">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{titles[tab]}</h1>
            <p className="text-muted-foreground">{subtitles[tab]}</p>
          </div>
          {tab === "dashboard" && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-soft active:scale-95"
            >
              <Plus size={18} />
              New Training
            </button>
          )}
        </header>

        {tab === "dashboard" && <DashboardContent trainings={trainings} staff={staff} loading={loading} onEdit={(docId) => setEditingDocumentId(docId)} onRefresh={onRefreshTrainings} />}
        {tab === "staff" && <StaffContent staff={staff} trainings={trainings} onAddStaff={onAddStaff} />}
        {tab === "branding" && <BrandingKnowledge />}
      </main>
    </div>
  );
}
