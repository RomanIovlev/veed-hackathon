import { useState, useEffect } from "react";
import { CheckCircle2, Globe, ChevronRight, LayoutDashboard, HelpCircle, LogOut, AlertCircle, X, Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { LANGUAGES, TRANSLATIONS } from "@/data/carelearn-data";
import { localDb as db } from "@/integrations/local/client";

interface WorkerTraining {
  id: string;
  title: string;
  category: string;
  topics: {
    videoNumber: number;
    title: string;
    script: string | null;
    hook: string | null;
    duration: string | null;
    keyLearningPoints: string[];
  }[];
}

export function WorkerView() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState<"login" | "list" | "player" | "complete">("login");
  const [trainings, setTrainings] = useState<WorkerTraining[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTraining, setActiveTraining] = useState<WorkerTraining | null>(null);
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [workerName, setWorkerName] = useState("");

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    if (step === "list") {
      fetchTrainings();
    }
  }, [step]);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const { data: docs } = await db
        .from("training_documents")
        .select("id, title");

      if (!docs || docs.length === 0) {
        setTrainings([]);
        setLoading(false);
        return;
      }

      const { data: scripts } = await db
        .from("video_scripts")
        .select("*")
        .in("document_id", docs.map((d) => d.id))
        .order("video_number", { ascending: true });

      const mapped: WorkerTraining[] = docs.map((doc) => {
        const docScripts = (scripts || []).filter((s) => s.document_id === doc.id);
        return {
          id: doc.id,
          title: doc.title,
          category: docScripts[0]?.category || "General",
          topics: docScripts.map((s) => ({
            videoNumber: s.video_number,
            title: s.title,
            script: s.script,
            hook: s.hook,
            duration: s.duration,
            keyLearningPoints: Array.isArray(s.key_learning_points)
              ? (s.key_learning_points as string[])
              : [],
          })),
        };
      });

      setTrainings(mapped);
    } catch (err) {
      console.error("Error fetching trainings:", err);
    }
    setLoading(false);
  };

  const currentTopic = activeTraining?.topics[currentTopicIdx];

  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="w-full max-w-[390px] h-[844px] bg-card rounded-[3rem] shadow-phone border-[8px] border-foreground/90 overflow-hidden relative flex flex-col">
        {/* LOGIN */}
        {step === "login" && (
          <LoginScreen
            lang={lang}
            setLang={setLang}
            workerName={workerName}
            setWorkerName={setWorkerName}
            t={t}
            onLogin={() => setStep("list")}
          />
        )}

        {/* TRAINING LIST */}
        {step === "list" && (
          <div className="flex-1 flex flex-col animate-slide-in-right">
            <header className="p-6 pb-2">
              <p className="text-muted-foreground text-sm font-medium">
                {t.welcome}, {workerName || "Staff"} 👋
              </p>
              <h2 className="text-2xl font-bold text-foreground">{t.myTrainings}</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="font-medium">No trainings assigned yet.</p>
                </div>
              ) : (
                trainings.map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => {
                      setActiveTraining(tr);
                      setCurrentTopicIdx(0);
                      setStep("player");
                    }}
                    className="w-full text-left bg-card border border-border rounded-3xl p-5 shadow-soft active:bg-secondary transition-colors relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                    <div className="flex justify-between items-start mb-3 pl-2">
                      <StatusBadge variant="default">{t.todo || "To do"}</StatusBadge>
                      <span className="text-xs font-bold text-muted-foreground">
                        {tr.topics.length} topics
                      </span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 pl-2 text-foreground">
                      {tr.title}
                    </h3>
                    <p className="text-xs text-muted-foreground pl-2 mb-2">{tr.category}</p>
                    <div className="flex items-center justify-between pl-2 mt-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full mr-4 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>

            <nav className="p-6 border-t border-border flex justify-around items-center">
              <LayoutDashboard className="text-primary" />
              <HelpCircle className="text-muted-foreground/40" />
              <button onClick={() => setStep("login")}>
                <LogOut className="text-muted-foreground/40" />
              </button>
            </nav>
          </div>
        )}

        {/* TOPIC PLAYER */}
        {step === "player" && activeTraining && currentTopic && (
          <div className="flex-1 flex flex-col animate-slide-in-bottom">
            {/* Progress bar */}
            <div className="p-4 pb-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Topic {currentTopicIdx + 1} of {activeTraining.topics.length}
                </span>
                <button onClick={() => setStep("list")}>
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${((currentTopicIdx + 1) / activeTraining.topics.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              <h2 className="text-xl font-bold text-foreground">{currentTopic.title}</h2>

              {currentTopic.hook && (
                <div className="p-4 bg-accent rounded-2xl border border-primary/20 flex gap-3">
                  <AlertCircle className="text-primary shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-accent-foreground font-medium italic">
                    {currentTopic.hook}
                  </p>
                </div>
              )}

              {currentTopic.keyLearningPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Key Learning Points
                  </h4>
                  <ul className="space-y-2">
                    {currentTopic.keyLearningPoints.map((point, i) => (
                      <li key={i} className="flex gap-2 items-start text-sm text-foreground">
                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                        <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentTopic.script && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Training Content
                  </h4>
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {currentTopic.script}
                  </div>
                </div>
              )}

              {currentTopic.duration && (
                <p className="text-xs text-muted-foreground">
                  ⏱ Estimated: {currentTopic.duration}
                </p>
              )}
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-border space-y-3">
              {currentTopicIdx < activeTraining.topics.length - 1 ? (
                <button
                  onClick={() => setCurrentTopicIdx((i) => i + 1)}
                  className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-bold text-lg shadow-elevated active:scale-95 transition-transform"
                >
                  Next Topic →
                </button>
              ) : (
                <button
                  onClick={() => setStep("complete")}
                  className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-bold text-lg shadow-elevated active:scale-95 transition-transform"
                >
                  Complete Training ✓
                </button>
              )}
              <button
                onClick={() => setStep("list")}
                className="w-full text-muted-foreground p-3 rounded-2xl font-medium text-sm"
              >
                ← {t.backToTrainings}
              </button>
            </div>
          </div>
        )}

        {/* COMPLETE */}
        {step === "complete" && activeTraining && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-zoom-in">
            <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 border-8 bg-emerald-100 text-success border-emerald-50">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Complete!</h2>
            <p className="text-muted-foreground mb-8 font-medium">
              {t.excellent || "You've successfully completed this training."}
            </p>
            <div className="w-full p-6 bg-secondary rounded-[2rem] border border-border mb-8">
              <div className="flex items-center justify-center gap-2 text-primary font-bold mb-1">
                <CheckCircle2 size={18} />
                <span>{t.certificateEarned || "Certificate Earned"}</span>
              </div>
              <p className="text-xs text-muted-foreground">{activeTraining.title}</p>
            </div>
            <button
              onClick={() => setStep("list")}
              className="w-full bg-foreground text-card p-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
            >
              {t.backToTrainings}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function LoginScreen({
  lang, setLang, workerName, setWorkerName, t, onLogin,
}: {
  lang: string;
  setLang: (v: string) => void;
  workerName: string;
  setWorkerName: (v: string) => void;
  t: Record<string, string>;
  onLogin: () => void;
}) {
  return (
    <div className="flex-1 p-8 flex flex-col justify-center animate-fade-in">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-8 shadow-elevated">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="text-2xl font-bold text-center mb-2 text-foreground">CareLearn</h1>
      <p className="text-muted-foreground text-center mb-10">{t.selectLanguage || "Staff Training Portal"}</p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">
            {t.selectLanguage}
          </label>
          <div className="relative">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full p-4 bg-secondary rounded-2xl border-none outline-none appearance-none font-medium text-foreground"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
            <Globe className="absolute right-4 top-4 text-muted-foreground" size={20} />
          </div>
        </div>
        <input
          value={workerName}
          onChange={(e) => setWorkerName(e.target.value)}
          type="text"
          placeholder={t.name}
          className="w-full p-4 bg-secondary rounded-2xl border-none outline-none font-medium text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="password"
          placeholder={t.pin}
          className="w-full p-4 bg-secondary rounded-2xl border-none outline-none font-medium text-center tracking-[1em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal"
          maxLength={4}
        />
        <button
          onClick={onLogin}
          className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-bold text-lg shadow-elevated active:scale-95 transition-transform mt-4"
        >
          {t.login}
        </button>
      </div>
    </div>
  );
}
