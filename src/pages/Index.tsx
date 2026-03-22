import { useState, useEffect, useCallback } from "react";
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

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      // Try new API endpoint with assignment statistics first
      console.log('🚀 Making API request to /api/trainings/with-stats');
      const response = await fetch('http://localhost:3002/api/trainings/with-stats');
      const result = await response.json();
      console.log('🔍 Raw API response:', result);
      
      if (result.success && result.data) {
        console.log('✅ API returned success with data:', result.data.length, 'trainings');
        const mappedTrainings: Training[] = result.data.map((doc: any) => {
          console.log(`🔍 Mapping training ${doc.title}:`, {
            raw_assigned: doc.assigned,
            raw_completed: doc.completed,
            parsed_assigned: parseInt(doc.assigned),
            parsed_completed: parseInt(doc.completed),
          });
          return {
            id: doc.id,
            title: doc.title,
            description: doc.description || "",
            categories: doc.categories || [],
            langs: doc.languages || ["en"],
            assigned: parseInt(doc.assigned) || 0, // Real assignment count from database
            completed: parseInt(doc.completed) || 0, // Real completion count from database
            status: doc.status || "Active",
            due: doc.due_date || new Date().toISOString().split("T")[0],
            duration: doc.duration || 10,
            notes: doc.notes || "",
            questions: doc.questions || [],
            assignedToGroups: doc.assigned_to_groups || [],
          };
        });
        console.log('🎯 Final mapped trainings before setState:', mappedTrainings);
        setTrainings(mappedTrainings);
        console.log(`📊 Loaded ${mappedTrainings.length} trainings with real assignment data`);
        mappedTrainings.forEach(training => {
          console.log(`🏷️ ${training.title}: assigned=${training.assigned}, completed=${training.completed}, id=${training.id}`);
        });
        setLoading(false);
        return; // Exit here to prevent fallback APIs from overwriting data
      }
    } catch (err) {
      console.error("Error with new API, trying basic endpoint:", err);
    }
    
    // Fallback to basic trainings endpoint
    try {
      const response = await fetch('http://localhost:3002/api/trainings');
      const result = await response.json();
      
      if (result.success && result.data) {
        const mappedTrainings: Training[] = result.data.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description || "",
          categories: doc.categories || [],
          langs: doc.languages || ["en"],
          assigned: 4, // Temporary: Each training assigned to 4 users (carers+nurses)
          completed: 0,
          status: doc.status || "Active",
          due: doc.due_date || new Date().toISOString().split("T")[0],
          duration: doc.duration || 10,
          notes: doc.notes || "",
          questions: doc.questions || [],
          assignedToGroups: doc.assigned_to_groups || [],
        }));
        setTrainings(mappedTrainings);
        console.log(`📊 Loaded ${mappedTrainings.length} trainings (fallback method)`);
        setLoading(false);
        return; // Exit here to prevent local client fallback from overwriting data
      }
    } catch (err) {
      console.error("Error with basic API:", err);
    }
    
    // Final fallback to local client
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
          assignedToGroups: doc.assigned_to_groups || [],
        }));
        setTrainings(mappedTrainings);
        console.log(`📊 Loaded ${mappedTrainings.length} trainings (local client fallback)`);
      }
    } catch (fallbackErr) {
      console.error("All methods failed:", fallbackErr);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since fetchTrainings doesn't depend on props/state

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
