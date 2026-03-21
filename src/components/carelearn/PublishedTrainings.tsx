import { useState, useEffect } from "react";
import { BookOpen, Clock, Globe, CheckCircle2, Loader2, Pencil, Filter, Trash2, AlertTriangle } from "lucide-react";
import { localDb as db } from "@/integrations/local/client";
import { TRAINING_CATEGORIES, getCategoryById, UNCATEGORISED } from "@/config/trainingCategories";
import type { TrainingCategory } from "@/config/trainingCategories";
import { StatusBadge } from "./StatusBadge";
import { toast } from "@/hooks/use-toast";

interface DBTraining {
  id: string;
  title: string;
  category: string;
  topicCount: number;
  createdAt: string;
  langCount: number;
}

interface PublishedTrainingsProps {
  onEdit?: (documentId: string) => void;
  onRefresh?: () => void;
}

function CategoryBadge({ category }: { category: TrainingCategory }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${category.colour.bg} ${category.colour.text} ${category.colour.border}`}
    >
      {category.label}
    </span>
  );
}

export function PublishedTrainings({ onEdit, onRefresh }: PublishedTrainingsProps) {
  const [trainings, setTrainings] = useState<DBTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await db.from("training_documents").delete().eq("id", id);
      toast({ title: "Training deleted successfully" });
      setDeleteConfirm(null);
      fetchTrainings();
      onRefresh?.();
    } catch (err: any) {
      console.error("Error deleting training:", err);
      toast({ title: "Failed to delete training", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const { data: docs } = await db
        .from("training_documents")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (!docs || docs.length === 0) {
        setTrainings([]);
        setLoading(false);
        return;
      }

      const { data: scripts } = await db
        .from("video_scripts")
        .select("document_id, category")
        .in("document_id", docs.map((d) => d.id));

      const mapped: DBTraining[] = docs.map((doc) => {
        const docScripts = (scripts || []).filter((s) => s.document_id === doc.id);
        return {
          id: doc.id,
          title: doc.title,
          category: docScripts[0]?.category || "uncategorised",
          topicCount: docScripts.length,
          langCount: 1,
          createdAt: doc.created_at,
        };
      });

      setTrainings(mapped);
    } catch (err) {
      console.error("Error fetching trainings:", err);
    }
    setLoading(false);
  };

  const uniqueCategories = new Set(trainings.map((t) => t.category));

  const filteredTrainings =
    activeFilter === "all"
      ? trainings
      : trainings.filter((t) => t.category === activeFilter);

  // Group trainings by category for the "All" view
  const groupedTrainings = () => {
    const groups: { category: TrainingCategory; items: DBTraining[] }[] = [];

    // Known categories first
    for (const cat of TRAINING_CATEGORIES) {
      const items = trainings.filter((t) => t.category === cat.id);
      if (items.length > 0) groups.push({ category: cat, items });
    }

    // Uncategorised at the bottom
    const uncatItems = trainings.filter(
      (t) => !TRAINING_CATEGORIES.some((c) => c.id === t.category)
    );
    if (uncatItems.length > 0) groups.push({ category: UNCATEGORISED, items: uncatItems });

    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4 mb-2">
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <p className="text-muted-foreground text-sm font-medium">Total Trainings</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">{trainings.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <p className="text-muted-foreground text-sm font-medium">Total Topics</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">
            {trainings.reduce((sum, t) => sum + t.topicCount, 0)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <p className="text-muted-foreground text-sm font-medium">Categories</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">{uniqueCategories.size}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-soft">
          <p className="text-muted-foreground text-sm font-medium">Languages Available</p>
          <p className="text-2xl font-bold tabular-nums mt-1 text-foreground">1</p>
        </div>
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
        {TRAINING_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              activeFilter === cat.id
                ? `${cat.colour.bg} ${cat.colour.text} ${cat.colour.border} shadow-sm`
                : "bg-secondary text-muted-foreground border-transparent hover:bg-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Training cards */}
      {activeFilter === "all" ? (
        // Grouped view
        groupedTrainings().map(({ category, items }) => (
          <div key={category.id} className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CategoryBadge category={category} />
              <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((training) => (
                <TrainingCard 
                  key={training.id} 
                  training={training} 
                  onEdit={onEdit}
                  onDelete={(id, title) => setDeleteConfirm({ id, title })}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        // Filtered view
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrainings.map((training) => (
            <TrainingCard 
              key={training.id} 
              training={training} 
              onEdit={onEdit}
              onDelete={(id, title) => setDeleteConfirm({ id, title })}
            />
          ))}
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

      {trainings.length === 0 && (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <CheckCircle2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No published trainings yet</p>
          <p className="text-sm text-muted-foreground/70">Create your first training to get started.</p>
        </div>
      )}

      {trainings.length > 0 && filteredTrainings.length === 0 && activeFilter !== "all" && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <p className="text-muted-foreground font-medium">No trainings in this category</p>
        </div>
      )}
    </div>
  );
}

function TrainingCard({
  training,
  onEdit,
  onDelete,
}: {
  training: DBTraining;
  onEdit?: (documentId: string) => void;
  onDelete?: (id: string, title: string) => void;
}) {
  const category = getCategoryById(training.category);

  return (
    <div className="text-left bg-card border border-border rounded-2xl shadow-soft overflow-hidden hover:shadow-elevated transition-shadow group">
      <div className={`h-1.5 ${category.colour.bg}`} />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <StatusBadge variant="active">Published</StatusBadge>
          <div className="flex items-center gap-2">
            <CategoryBadge category={category} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(training.id, training.title);
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all opacity-0 group-hover:opacity-100"
              title="Delete training"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={() => onEdit?.(training.id)}
          className="w-full text-left"
        >
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
            {training.title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <BookOpen size={14} />
              {training.topicCount} topics
            </span>
            <span className="flex items-center gap-1">
              <Globe size={14} />
              {training.langCount} lang{training.langCount !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {new Date(training.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={14} />
            Click to edit
          </div>
        </button>
      </div>
    </div>
  );
}
