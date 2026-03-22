import { useState, useEffect } from "react";
import { FileText, Users, CheckCircle2, AlertCircle, Pencil, Trash2, AlertTriangle, Loader2, Filter } from "lucide-react";
import { StatCard } from "./StatCard";
import { StatusBadge } from "./StatusBadge";
import { Training, StaffMember, LANGUAGES } from "@/data/carelearn-data";
import { localDb as db } from "@/integrations/local/client";
import { toast } from "@/hooks/use-toast";
import { formatDueDate } from "@/lib/utils";
// User groups for filtering trainings by assignment
const USER_GROUPS = [
  { id: 'carer', label: 'Carer', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'senior-carer', label: 'Senior Carer', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'nurse', label: 'Nurse', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'manager', label: 'Manager', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'all-staff', label: 'All Staff', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];


interface DashboardContentProps {
  trainings: Training[];
  staff: StaffMember[];
  loading?: boolean;
  onEdit?: (trainingId: string) => void;
  onRefresh?: () => void;
}

export function DashboardContent({ trainings, staff, loading, onEdit, onRefresh }: DashboardContentProps) {
  console.log('🎯 DashboardContent received trainings:', trainings.map(t => ({ title: t.title, assigned: t.assigned, completed: t.completed })));
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [assignmentStats, setAssignmentStats] = useState({
    total_assignments: 0,
    total_completed: 0,
    completion_rate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Filter trainings based on selected user group
  const filteredTrainings = activeFilter === "all" 
    ? trainings 
    : trainings.filter((t) => t.assignedToGroups.includes(activeFilter));
  
  console.log(`🔍 Active filter: ${activeFilter}, Filtered trainings:`, filteredTrainings.map(t => ({ 
    title: t.title, 
    assigned: t.assigned, 
    assignedToGroups: t.assignedToGroups 
  })));

  const fetchAssignmentStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('http://localhost:3002/api/stats/assignments');
      const result = await response.json();
      
      if (result.success) {
        setAssignmentStats(result.data);
        console.log('📊 Assignment stats loaded:', result.data);
      }
    } catch (err) {
      console.error('Error fetching assignment stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch real assignment statistics from database
  useEffect(() => {
    fetchAssignmentStats();
  }, []); // Run once on component mount

  // Refresh stats when trainings change
  useEffect(() => {
    if (trainings.length > 0 && !loading) {
      fetchAssignmentStats();
    }
  }, [trainings.length]); // Only depend on the count of trainings

  const totalAssigned = assignmentStats.total_assignments;
  const totalCompleted = assignmentStats.total_completed;
  const completionRate = assignmentStats.completion_rate;
  const overdueCount = trainings.filter((t) => t.status === "Overdue").length;

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await db.from("training_documents").delete().eq("id", id);
      toast({ title: "Training deleted successfully" });
      setDeleteConfirm(null);
      onRefresh?.();
    } catch (err: any) {
      console.error("Error deleting training:", err);
      toast({ title: "Failed to delete training", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

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
        <StatCard 
          label="Staff Assigned" 
          value={statsLoading ? "..." : String(totalAssigned)} 
          icon={<Users className="text-blue-600" size={20} />} 
        />
        <StatCard 
          label="Completion Rate" 
          value={statsLoading ? "..." : `${completionRate}%`} 
          icon={<CheckCircle2 className="text-success" size={20} />} 
        />
        <StatCard label="Overdue" value={String(overdueCount)} icon={<AlertCircle className="text-destructive" size={20} />} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={16} className="text-muted-foreground shrink-0" />
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            activeFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:bg-accent"
          }`}
        >
          All
        </button>
        {USER_GROUPS.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveFilter(group.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeFilter === group.id
                ? `${group.color} shadow-sm`
                : "bg-secondary text-muted-foreground border-transparent hover:bg-accent"
            }`}
          >
            {group.label}
          </button>
        ))}
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
            {filteredTrainings.map((t) => (
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
                <td className="px-6 py-4 text-muted-foreground text-sm">{formatDueDate(t.due)}</td>
                <td className="px-6 py-4">
                  <StatusBadge variant={t.status === "Overdue" ? "error" : t.status === "Draft" ? "default" : "active"}>
                    {t.status}
                  </StatusBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button 
                      onClick={() => onEdit?.(t.id)}
                      className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors"
                      title="Edit training"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ id: t.id, title: t.title })}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete training"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state for filtered results */}
      {filteredTrainings.length === 0 && activeFilter !== "all" && trainings.length > 0 && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl mt-6">
          <p className="text-muted-foreground font-medium">No trainings assigned to this group</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-elevated">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Delete Training?</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete "<span className="font-medium text-foreground">{deleteConfirm.title}</span>"? 
              This will permanently remove the training and all its topics.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl font-medium border border-border text-foreground hover:bg-secondary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Training
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
