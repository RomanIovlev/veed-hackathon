import { useState, useEffect } from "react";
import { ManagerPortal } from "@/components/carelearn/ManagerPortal";
import { WorkerView } from "@/components/carelearn/WorkerView";
import { INITIAL_STAFF, Training, StaffMember } from "@/data/carelearn-data";
import { localDb as db } from "@/integrations/local/client";

const Index = () => {
  const [view, setView] = useState<"manager" | "worker">("manager");
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [loading, setLoading] = useState(true);

  // Fetch trainings from database on mount
  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const { data: docs } = await db.from("training_documents").select("*");
      
      if (docs && docs.length > 0) {
        const mappedTrainings: Training[] = docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description || "",
          categories: doc.categories || [],
          langs: doc.languages || ["en"],
          assigned: 0,
          completed: 0,
          status: doc.status || "Active",
          due: doc.due_date || new Date().toISOString().split("T")[0],
          duration: doc.duration || 10,
          notes: doc.notes || "",
          questions: doc.questions || [],
        }));
        setTrainings(mappedTrainings);
      }
    } catch (err) {
      console.error("Error fetching trainings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTraining = (training: Training) => {
    setTrainings((prev) => [...prev, training]);
    // Refresh from database to ensure sync
    fetchTrainings();
  };

  const handleAddStaff = (member: StaffMember) => {
    setStaff((prev) => [...prev, member]);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* View Switcher */}
      <div className="fixed bottom-4 right-4 flex gap-2 z-50 bg-card p-2 rounded-full shadow-elevated border border-border">
        <button
          onClick={() => setView("manager")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === "manager" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Manager View
        </button>
        <button
          onClick={() => setView("worker")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === "worker" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          Worker View
        </button>
      </div>

      {view === "manager" ? (
        <ManagerPortal 
          trainings={trainings} 
          staff={staff} 
          onAddTraining={handleAddTraining} 
          onAddStaff={handleAddStaff}
          onRefreshTrainings={fetchTrainings}
          loading={loading}
        />
      ) : (
        <WorkerView />
      )}
    </div>
  );
};

export default Index;
