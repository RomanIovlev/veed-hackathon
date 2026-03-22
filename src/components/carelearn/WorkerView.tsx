import { useState, useEffect } from "react";
import { CheckCircle2, Globe, ChevronRight, LayoutDashboard, HelpCircle, LogOut, AlertCircle, X, Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { LANGUAGES, TRANSLATIONS } from "@/data/carelearn-data";
import { localDb as db } from "@/integrations/local/client";

interface ContentBlock {
  type: string;
  value: string;
  quiz?: any[];
}

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
    contentBlocks: ContentBlock[];
  }[];
}

interface AuthenticatedUser {
  id: number;
  name: string;
  role: string;
  user_groups: string[];
  language_code: string;
  flag: string;
}

export function WorkerView() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState<"login" | "list" | "player" | "complete">("login");
  const [trainings, setTrainings] = useState<WorkerTraining[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTraining, setActiveTraining] = useState<WorkerTraining | null>(null);
  const [currentTopicIdx, setCurrentTopicIdx] = useState(0);
  const [workerName, setWorkerName] = useState("");
  const [workerPin, setWorkerPin] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [loginError, setLoginError] = useState("");

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    if (step === "list") {
      fetchTrainings();
    }
  }, [step]);

  const handleLogin = async () => {
    if (!workerName.trim() || !workerPin.trim()) {
      setLoginError("Please enter both name and PIN");
      return;
    }
    
    setLoading(true);
    setLoginError("");
    
    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workerName.trim(), pin: workerPin.trim() })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        setLoginError(result.error || 'Invalid name or PIN');
        return;
      }
      
      setCurrentUser(result.data);
      setLang(result.data.language_code || 'en');
      setStep("list");
      console.log('✅ User authenticated:', result.data.name, 'Groups:', result.data.user_groups);
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/users/${currentUser.id}/trainings`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trainings');
      }
      
      const docs = result.data || [];
      console.log(`🎯 Fetched ${docs.length} trainings for ${currentUser.name} (groups: ${currentUser.user_groups.join(', ')})`);

      const mapped: WorkerTraining[] = docs.map((doc: any) => {
        const videoScripts = doc.video_scripts || [];
        return {
          id: doc.id,
          title: doc.title,
          category: videoScripts[0]?.category || "General",
          topics: videoScripts.map((s: any) => ({
            videoNumber: s.video_number,
            title: s.title,
            script: s.script,
            hook: s.hook,
            duration: s.duration,
            keyLearningPoints: Array.isArray(s.key_learning_points)
              ? (s.key_learning_points as string[])
              : [],
            contentBlocks: Array.isArray(s.content_blocks) ? s.content_blocks : [],
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
            workerPin={workerPin}
            setWorkerPin={setWorkerPin}
            loginError={loginError}
            loading={loading}
            t={t}
            onLogin={handleLogin}
          />
        )}

        {/* TRAINING LIST */}
        {step === "list" && (
          <div className="flex-1 flex flex-col animate-slide-in-right">
            <header className="p-6 pb-2">
              <p className="text-muted-foreground text-sm font-medium">
                {t.welcome}, {currentUser?.name || workerName || "Staff"} 👋
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {currentUser?.role} • Groups: {currentUser?.user_groups.filter(g => g !== 'all-staff').join(', ')}
              </p>
              <div className="flex justify-between items-baseline">
                <h2 className="text-2xl font-bold text-foreground">{t.myTrainings}</h2>
                <span className="text-sm text-muted-foreground font-medium">
                  {trainings.length} assigned
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : trainings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="font-medium">No trainings assigned to your groups.</p>
                  <p className="text-xs mt-2">
                    Your groups: {currentUser?.user_groups.filter(g => g !== 'all-staff').join(', ') || 'None'}
                  </p>
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
              <button onClick={() => {
                setCurrentUser(null);
                setWorkerName("");
                setWorkerPin("");
                setLoginError("");
                setStep("login");
              }}>
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

              {currentTopic.contentBlocks && currentTopic.contentBlocks.length > 0 && (
                <div className="space-y-4">
                  {currentTopic.contentBlocks
                    .filter(block => block.type === 'video' || block.type === 'quiz')
                    .map((block, index) => (
                      <div key={index}>
                        {block.type === 'video' && block.value && (
                          <div className="rounded-xl overflow-hidden bg-muted">
                            <video 
                              controls 
                              className="w-full"
                              src={`http://localhost:3002${block.value}`}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        {block.type === 'quiz' && block.quiz && block.quiz.length > 0 && (
                          <div className="border border-border rounded-xl p-4 space-y-4">
                            <h4 className="text-sm font-semibold mb-3">Knowledge Check</h4>
                            {block.quiz.map((question: any, qIndex: number) => (
                              <div key={qIndex} className="space-y-3">
                                <p className="font-medium">{question.text}</p>
                                <div className="space-y-2">
                                  {question.options.map((option: string, oIndex: number) => (
                                    option && (
                                      <label key={oIndex} className="flex items-center space-x-3 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name={`question-${qIndex}`}
                                          value={oIndex}
                                          className="w-4 h-4 text-primary"
                                        />
                                        <span className="text-sm">{option}</span>
                                      </label>
                                    )
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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
  lang, setLang, workerName, setWorkerName, workerPin, setWorkerPin, loginError, loading, t, onLogin,
}: {
  lang: string;
  setLang: (v: string) => void;
  workerName: string;
  setWorkerName: (v: string) => void;
  workerPin: string;
  setWorkerPin: (v: string) => void;
  loginError: string;
  loading: boolean;
  t: Record<string, string>;
  onLogin: () => void;
}) {
  return (
    <div className="flex-1 p-8 flex flex-col justify-center animate-fade-in">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground mx-auto mb-8 shadow-elevated">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="text-2xl font-bold text-center mb-2 text-foreground">CareLearn</h1>
      <p className="text-muted-foreground text-center mb-4">{t.selectLanguage || "Staff Training Portal"}</p>
      
      {/* Demo Credentials */}
      <div className="bg-accent/30 border border-primary/20 rounded-2xl p-3 mb-6">
        <p className="text-xs font-bold text-foreground mb-2">Demo Accounts:</p>
        <div className="text-xs space-y-1">
          <p><strong>Maria Santos</strong> (Carer) - PIN: 1234</p>
          <p><strong>Ana Popescu</strong> (Senior Carer) - PIN: 2345</p>
          <p><strong>Dariya Kovalenko</strong> (Nurse) - PIN: 3456</p>
          <p><strong>Jan de Vries</strong> (Manager) - PIN: 4567</p>
        </div>
      </div>

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
          value={workerPin}
          onChange={(e) => setWorkerPin(e.target.value)}
          type="password"
          placeholder={t.pin}
          className="w-full p-4 bg-secondary rounded-2xl border-none outline-none font-medium text-center tracking-[1em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal"
          maxLength={4}
        />
        {loginError && (
          <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-2xl text-sm font-medium">
            {loginError}
          </div>
        )}
        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground p-4 rounded-2xl font-bold text-lg shadow-elevated active:scale-95 transition-transform mt-4 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              Signing in...
            </div>
          ) : (
            t.login
          )}
        </button>
      </div>
    </div>
  );
}
