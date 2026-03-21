import { useState } from "react";
import { Plus, X } from "lucide-react";
import { StaffMember, Training, LANGUAGES } from "@/data/carelearn-data";
import { StaffProfile } from "./StaffProfile";

interface StaffContentProps {
  staff: StaffMember[];
  trainings: Training[];
  onAddStaff: (staff: StaffMember) => void;
}

export function StaffContent({ staff, trainings, onAddStaff }: StaffContentProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("Carer");
  const [newEmail, setNewEmail] = useState("");
  const [newLang, setNewLang] = useState("en");

  const handleAdd = () => {
    if (!newName.trim()) return;
    const lang = LANGUAGES.find((l) => l.code === newLang);
    onAddStaff({
      id: Date.now(),
      name: newName,
      role: newRole,
      email: newEmail,
      lang: newLang,
      flag: lang?.flag || "🏳️",
      completed: 0,
      assigned: 0,
      lastActive: "Now",
    });
    setShowModal(false);
    setNewName("");
    setNewEmail("");
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-soft active:scale-95"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-sm">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Language</th>
              <th className="px-6 py-4 font-medium text-center">Progress</th>
              <th className="px-6 py-4 font-medium">Last Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {staff.map((s) => (
              <tr
                key={s.id}
                onClick={() => setSelectedMember(s)}
                className="hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {s.name.charAt(0)}
                  </div>
                  <span className="hover:text-primary transition-colors">{s.name}</span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{s.role}</td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2">
                    <span>{s.flag}</span>
                    <span className="text-sm uppercase text-muted-foreground">{s.lang}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: s.assigned > 0 ? `${(s.completed / s.assigned) * 100}%` : "0%" }} />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                      {s.completed}/{s.assigned}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm">{s.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <StaffProfile
          member={selectedMember}
          trainings={trainings}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl shadow-elevated p-8 w-full max-w-md animate-zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Add Staff Member</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Full Name</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 ring-ring/20 outline-none text-foreground" placeholder="e.g. John Smith" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full p-3 rounded-xl border border-border bg-background outline-none text-foreground">
                  <option>Carer</option>
                  <option>Senior Carer</option>
                  <option>Nurse</option>
                  <option>Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Email</label>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 ring-ring/20 outline-none text-foreground" placeholder="john@care.nl" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">Language</label>
                <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="w-full p-3 rounded-xl border border-border bg-background outline-none text-foreground">
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-xl font-medium transition-all active:scale-95 mt-2">
                Add Staff Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
