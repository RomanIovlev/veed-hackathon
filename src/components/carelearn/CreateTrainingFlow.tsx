import { useState, useEffect, useRef } from "react";
import { X, Check, Video, Trash2, Sparkles, Loader2, Plus, FileText, Image, ChevronRight, ChevronDown, HelpCircle, Clock, Flag, MessageSquareQuote, ListChecks, Clapperboard, Target, Eye, Upload, Users } from "lucide-react";
import { localDb as db } from "@/integrations/local/client";
import { toast } from "@/hooks/use-toast";
import { Training, StaffMember, LANGUAGES, QuizQuestion, UserGroup, USER_GROUPS } from "@/data/carelearn-data";
import { TRAINING_CATEGORIES, getCategoryById } from "@/config/trainingCategories";

interface TopicContentBlock {
  type: "text" | "image" | "video" | "quiz";
  value: string;
  quiz?: QuizQuestion[];
  image_prompt?: string;
  video_brief?: string;
}

interface Topic {
  id: number;
  title: string;
  hook: string;
  keyLearningPoints: string[];
  script: string;
  callToAction: string;
  duration: string;
  priority: string;
  content: TopicContentBlock[];
}

interface CreateTrainingFlowProps {
  staff: StaffMember[];
  onBack: () => void;
  onPublish: (training: Training) => void;
  editingDocumentId?: string | null;
}

const STEPS = ["Details", "Content", "Preview"];

// Field validation constants
const TITLE_MIN_LENGTH = 10;
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MIN_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

interface ValidationErrors {
  title?: string;
  description?: string;
  categories?: string;
  coverImage?: string;
  languages?: string;
}

export function CreateTrainingFlow({ staff, onBack, onPublish, editingDocumentId }: CreateTrainingFlowProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  
  // Debug: Log coverImage state changes
  useEffect(() => {
    console.log('🔍 DEBUG - coverImage state changed:', {
      exists: !!coverImage,
      length: coverImage?.length || 0,
      type: coverImage?.startsWith('data:') ? 'Base64' : coverImage ? 'URL' : 'Empty',
      preview: coverImage ? coverImage.substring(0, 30) + '...' : 'NO IMAGE'
    });
  }, [coverImage]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en"]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topics, setTopics] = useState<Topic[]>([
    { id: 1, title: "Introduction", hook: "", keyLearningPoints: [], script: "", callToAction: "", duration: "", priority: "", content: [] },
  ]);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [generatingTopicId, setGeneratingTopicId] = useState<number | null>(null);
  const [generatingQuizTopicId, setGeneratingQuizTopicId] = useState<number | null>(null);
  const [topicAiSuggestion, setTopicAiSuggestion] = useState<{ topicId: number; text: string } | null>(null);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [generatingImageBlockKey, setGeneratingImageBlockKey] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<Record<string, string>>({});
  const [generatingAllTopicId, setGeneratingAllTopicId] = useState<number | null>(null);
  const [autoGeneratingTopicIds, setAutoGeneratingTopicIds] = useState<Set<number>>(new Set());
  const [generatingVideoBlockKey, setGeneratingVideoBlockKey] = useState<string | null>(null);
  const [videoGenerationErrors, setVideoGenerationErrors] = useState<Record<string, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewTopicId, setPreviewTopicId] = useState<number | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editingDocumentId);
  const isEditing = !!editingDocumentId;

  // Load existing training data when editing
  useEffect(() => {
    if (!editingDocumentId) return;
    const loadTraining = async () => {
      setIsLoadingEdit(true);
      try {
        const { data: doc } = await db
          .from("training_documents")
          .select("*")
          .eq("id", editingDocumentId)
          .single();

        if (doc) {
          setTitle(doc.title || "");
          setDescription(doc.description || "");
          setCoverImage(doc.cover_image_url || "");
          
          // Load categories from document
          if (Array.isArray(doc.categories) && doc.categories.length > 0) {
            setCategories(doc.categories);
          }
          
          // Load languages from document
          if (Array.isArray(doc.languages) && doc.languages.length > 0) {
            setSelectedLangs(doc.languages);
          }
          
          // Load assigned groups from document
          if (Array.isArray(doc.assigned_to_groups) && doc.assigned_to_groups.length > 0) {
            setSelectedGroups(doc.assigned_to_groups);
          }
        }

        const { data: scripts } = await db
          .from("video_scripts")
          .select("*")
          .eq("document_id", editingDocumentId)
          .order("video_number", { ascending: true });

        if (scripts && scripts.length > 0) {
          const loadedTopics: Topic[] = scripts.map((s) => {
            // Parse content_blocks from DB if available
            let contentBlocks: TopicContentBlock[] = [];
            if (s.content_blocks && Array.isArray(s.content_blocks)) {
              contentBlocks = s.content_blocks as TopicContentBlock[];
            } else {
              contentBlocks = [{ type: "text" as const, value: s.script || "" }];
            }
            
            return {
              id: s.video_number,
              title: s.title,
              hook: s.hook || "",
              keyLearningPoints: Array.isArray(s.key_learning_points) ? (s.key_learning_points as string[]) : [],
              script: s.script || "",
              callToAction: s.call_to_action || "",
              duration: s.duration || "",
              priority: s.priority || "",
              content: contentBlocks,
            };
          });
          setTopics(loadedTopics);
          setActiveTopicId(loadedTopics[0]?.id ?? null);
        }
      } catch (err) {
        console.error("Error loading training:", err);
        toast({ title: "Failed to load training", variant: "destructive" });
      }
      setIsLoadingEdit(false);
    };
    loadTraining();
  }, [editingDocumentId]);

  // Auto-generate content for a single topic (text fields only — no image/video generation)
  const autoGenerateContent = async (topic: Topic) => {
    if (!topic.title) return;
    setAutoGeneratingTopicIds((prev) => new Set(prev).add(topic.id));
    try {
      const { data, error } = await db.functions.invoke("generate-topic-content", {
        body: { topicTitle: topic.title, trainingTitle: title, categories: categories.join(", ") },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newContent: TopicContentBlock[] = [
        { type: "image", value: "", image_prompt: data.image_prompt || data.imagePrompt || "" },
        { type: "video", value: "", video_brief: data.video_brief || data.videoSuggestion || "" },
        { type: "quiz", value: "", quiz: data.quiz || [] },
      ];

      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id
            ? {
                ...t,
                hook: data.hook || "",
                keyLearningPoints: data.keyLearningPoints || [],
                script: data.script || "",
                callToAction: data.callToAction || "",
                duration: data.duration || "",
                priority: data.priority || "",
                content: newContent,
              }
            : t
        )
      );
    } catch (e: any) {
      console.error(`Auto-generate failed for topic "${topic.title}":`, e.message);
    } finally {
      setAutoGeneratingTopicIds((prev) => {
        const next = new Set(prev);
        next.delete(topic.id);
        return next;
      });
    }
  };

  // Sequential auto-generation for multiple topics
  const autoGenerateAllTopics = async (topicsList: Topic[]) => {
    for (const topic of topicsList) {
      await autoGenerateContent(topic);
    }
    toast({ title: "AI content generated for all topics" });
  };

  // Validation functions
  const validateTitle = (value: string): string | undefined => {
    if (!value.trim()) return "Training title is required";
    if (value.trim().length < TITLE_MIN_LENGTH) return `Title must be at least ${TITLE_MIN_LENGTH} characters`;
    if (value.trim().length > TITLE_MAX_LENGTH) return `Title must not exceed ${TITLE_MAX_LENGTH} characters`;
    return undefined;
  };

  const validateDescription = (value: string): string | undefined => {
    if (!value.trim()) return "Description is required";
    if (value.trim().length < DESCRIPTION_MIN_LENGTH) return `Description must be at least ${DESCRIPTION_MIN_LENGTH} characters`;
    if (value.trim().length > DESCRIPTION_MAX_LENGTH) return `Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`;
    return undefined;
  };

  const validateCategories = (value: string[]): string | undefined => {
    if (value.length === 0) return "At least one category is required";
    return undefined;
  };

  const validateLanguages = (value: string[]): string | undefined => {
    if (value.length === 0) return "At least one language is required";
    return undefined;
  };

  // Validation helper
  const validateStep1 = (): boolean => {
    const errors: ValidationErrors = {};
    
    const titleError = validateTitle(title);
    if (titleError) errors.title = titleError;
    
    const descriptionError = validateDescription(description);
    if (descriptionError) errors.description = descriptionError;
    
    const categoriesError = validateCategories(categories);
    if (categoriesError) errors.categories = categoriesError;
    
    const languagesError = validateLanguages(selectedLangs);
    if (languagesError) errors.languages = languagesError;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors(prev => ({ ...prev, coverImage: "File size must be less than 5MB" }));
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setValidationErrors(prev => ({ ...prev, coverImage: "Please select an image file" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverImage(e.target.result as string);
        setValidationErrors(prev => ({ ...prev, coverImage: undefined }));
      }
    };
    reader.readAsDataURL(file);
  };

  const generateDescription = async () => {
    if (!title && !description) {
      toast({ title: "Please enter a title or description first", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setAiSuggestion("");
    try {
      const { data, error } = await db.functions.invoke("generate-description", {
        body: { title, category: categories.join(", "), description },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiSuggestion(data.suggestion || "");
    } catch (e: any) {
      toast({ title: "Failed to generate suggestion", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLang = (code: string) => {
    setSelectedLangs((prev) => (prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]));
    // Clear validation error when user selects a language
    setValidationErrors(prev => ({ ...prev, languages: undefined }));
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) => (prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]));
  };

  // Calculate total staff count based on selected groups
  const getAssignedStaffCount = (): number => {
    if (selectedGroups.includes("all-staff")) {
      return staff.length;
    }
    
    const roleMapping: Record<string, string[]> = {
      "carer": ["Carer"],
      "senior-carer": ["Senior Carer"],
      "nurse": ["Nurse"],
      "manager": ["Manager"]
    };

    const includedRoles = selectedGroups.flatMap(groupId => roleMapping[groupId] || []);
    const uniqueStaff = new Set<number>();
    
    staff.forEach(member => {
      if (includedRoles.includes(member.role)) {
        uniqueStaff.add(member.id);
      }
    });
    
    return uniqueStaff.size;
  };

  const generateTopicQuiz = async (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic?.title) {
      toast({ title: "Please name this topic first", variant: "destructive" });
      return;
    }
    setGeneratingQuizTopicId(topicId);
    try {
      const topicText = [topic.script, ...topic.content.filter((b) => b.type === "text").map((b) => b.value)].filter(Boolean).join("\n");
      const { data, error } = await db.functions.invoke("generate-topic-quiz", {
        body: { topicTitle: topic.title, topicText, trainingTitle: title, categories: categories.join(", ") },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.questions?.length) {
        setTopics((prev) =>
          prev.map((t) => {
            if (t.id !== topicId) return t;
            const hasQuiz = t.content.some((b) => b.type === "quiz");
            if (hasQuiz) {
              return { ...t, content: t.content.map((b) => b.type === "quiz" ? { ...b, quiz: data.questions } : b) };
            }
            return { ...t, content: [...t.content, { type: "quiz" as const, value: "", quiz: data.questions }] };
          })
        );
        toast({ title: `Generated ${data.questions.length} quiz questions` });
      }
    } catch (e: any) {
      toast({ title: "Failed to generate quiz", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingQuizTopicId(null);
    }
  };

  const generateAllContent = async (topicId: number) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic?.title) {
      toast({ title: "Please name this topic first", variant: "destructive" });
      return;
    }
    setGeneratingAllTopicId(topicId);
    try {
      const { data, error } = await db.functions.invoke("generate-topic-content", {
        body: { topicTitle: topic.title, trainingTitle: title, categories: categories.join(", ") },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newContent: TopicContentBlock[] = [
        { type: "image", value: "", image_prompt: data.image_prompt || data.imagePrompt || "" },
        { type: "video", value: "", video_brief: data.video_brief || data.videoSuggestion || "" },
        { type: "quiz", value: "", quiz: data.quiz || [] },
      ];

      setTopics((prev) =>
        prev.map((t) =>
          t.id === topicId
            ? {
                ...t,
                hook: data.hook || "",
                keyLearningPoints: data.keyLearningPoints || [],
                script: data.script || "",
                callToAction: data.callToAction || "",
                duration: data.duration || "",
                priority: data.priority || "",
                content: newContent,
              }
            : t
        )
      );
      toast({ title: "AI content generated for all sections" });
    } catch (e: any) {
      toast({ title: "Failed to generate content", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingAllTopicId(null);
    }
  };

  const allQuestions = topics.flatMap((t) =>
    t.content.filter((b) => b.type === "quiz").flatMap((b) => b.quiz || [])
  );

  const handlePublish = async () => {
    try {
      // Build the training document data (use camelCase for API compatibility)
      const trainingDocData = {
        title: title || "Untitled Training",
        description: description || "",
        categories: categories.length > 0 ? categories : [],
        languages: selectedLangs.length > 0 ? selectedLangs : ["en"],
        coverImageUrl: coverImage || null,
        assignedToGroups: selectedGroups.length > 0 ? selectedGroups : [],
        status: "Active",
      };

      if (isEditing && editingDocumentId) {
        // Update existing training
        await db
          .from("training_documents")
          .update(trainingDocData)
          .eq("id", editingDocumentId);

        // Delete old scripts and re-insert
        await db
          .from("video_scripts")
          .delete()
          .eq("document_id", editingDocumentId);

        const scriptRows = topics.map((t, idx) => ({
          document_id: editingDocumentId,
          video_number: idx + 1,
          title: t.title,
          category: categories[0] || "General",
          hook: t.hook || null,
          script: t.script || null,
          call_to_action: t.callToAction || null,
          duration: t.duration || null,
          priority: t.priority || null,
          key_learning_points: t.keyLearningPoints,
          content_blocks: t.content,
        }));

        await db.from("video_scripts").insert(scriptRows);
        toast({ title: "Training updated successfully" });
      } else {
        // Create new
        const { data: doc } = await db
          .from("training_documents")
          .insert(trainingDocData)
          .select()
          .single();

        if (doc) {
          const scriptRows = topics.map((t, idx) => ({
            document_id: doc.id,
            video_number: idx + 1,
            title: t.title,
            category: categories[0] || "General",
            hook: t.hook || null,
            script: t.script || null,
            call_to_action: t.callToAction || null,
            duration: t.duration || null,
            priority: t.priority || null,
            key_learning_points: t.keyLearningPoints,
            content_blocks: t.content,
          }));

          await db.from("video_scripts").insert(scriptRows);
        }
        toast({ title: "Training published successfully" });
      }

      const newTraining: Training = {
        id: Date.now(),
        title: title || "Untitled Training",
        description,
        categories,
        langs: selectedLangs,
        assigned: getAssignedStaffCount(),
        completed: 0,
        status: "Active",
        due: new Date().toISOString().split("T")[0],
        duration: 10,
        notes: "",
        questions: allQuestions.filter((q) => q.text.trim()),
      };
      if (!isEditing) onPublish(newTraining);
      onBack();
    } catch (err: any) {
      toast({ title: "Failed to save training", description: err.message, variant: "destructive" });
    }
  };

  const updateTopic = (topicId: number, updates: Partial<Topic>) => {
    setTopics((prev) => prev.map((t) => (t.id === topicId ? { ...t, ...updates } : t)));
  };

  const updateTopicBlock = (topicId: number, blockIdx: number, updates: Partial<TopicContentBlock>) => {
    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId
          ? { ...t, content: t.content.map((b, i) => (i === blockIdx ? { ...b, ...updates } : b)) }
          : t
      )
    );
  };

  // Generate video using VEED API backend
  const generateVideo = async (topicId: number, blockIdx?: number) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic?.script) {
      toast({ title: "Please add a script to this topic first", variant: "destructive" });
      return;
    }

    // Debug: Check what we have in coverImage state
    console.log('🔍 DEBUG - coverImage state:', {
      exists: !!coverImage,
      type: typeof coverImage,
      length: coverImage?.length || 0,
      startsWithData: coverImage?.startsWith('data:') || false,
      preview: coverImage ? coverImage.substring(0, 50) + '...' : 'UNDEFINED'
    });

    if (!coverImage || coverImage.trim() === '') {
      toast({ title: "Please upload a cover image first", description: "Go to Step 1 (Details) and upload an image before generating video", variant: "destructive" });
      return;
    }

    const blockKey = blockIdx !== undefined ? `${topicId}-${blockIdx}` : `${topicId}-preview`;
    setGeneratingVideoBlockKey(blockKey);
    setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: '' }));

    try {
      console.log('🎬 Generating video with:', {
        script: topic.script ? topic.script.substring(0, 50) + '...' : 'NO SCRIPT',
        imageType: coverImage ? (coverImage.startsWith('data:') ? 'User Upload (Base64)' : 'URL') : 'NO IMAGE',
        imagePreview: coverImage ? coverImage.substring(0, 50) + '...' : 'NO IMAGE'
      });

      // Prepare request body with validation
      const requestBody = {
        script: topic.script || '',
        imageUrl: coverImage || '',
        resolution: '720p'
      };
      
      // Debug: Log exactly what we're sending
      console.log('🔍 DEBUG - Request body being sent:', {
        script: requestBody.script ? `${requestBody.script.length} characters` : 'EMPTY',
        imageUrl: requestBody.imageUrl ? `${requestBody.imageUrl.length} characters` : 'EMPTY',
        resolution: requestBody.resolution
      });

      const response = await fetch('http://localhost:3004/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Video generation failed');
      }

      if (result.success && result.videoUrl) {
        if (blockIdx !== undefined) {
          // Update existing video block
          updateTopicBlock(topicId, blockIdx, { value: result.videoUrl });
        } else {
          // Add new video block or update existing one
          setTopics((prev) =>
            prev.map((t) => {
              if (t.id !== topicId) return t;
              
              const hasVideoBlock = t.content.some((b) => b.type === "video");
              if (hasVideoBlock) {
                return {
                  ...t,
                  content: t.content.map((b) => 
                    b.type === "video" ? { ...b, value: result.videoUrl } : b
                  )
                };
              } else {
                return {
                  ...t,
                  content: [...t.content, { type: "video" as const, value: result.videoUrl }]
                };
              }
            })
          );
        }
        
        toast({ title: "Video generated successfully!" });
      } else {
        throw new Error('No video URL received from server');
      }

    } catch (error: any) {
      console.error('Video generation failed:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: errorMessage }));
      
      let toastTitle = "Video generation failed";
      let toastDescription = errorMessage;
      
      // Provide specific error messages based on the error type
      if (errorMessage.includes('API key not configured') || errorMessage.includes('credentials')) {
        toastTitle = "⚠️ API Key Required";
        toastDescription = "Please set your FAL_KEY environment variable and restart the backend server.";
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
        toastTitle = "🔌 Backend Not Running";
        toastDescription = "Please start the video backend server: cd backend && npm run dev";
      } else if (errorMessage.includes('Unauthorized')) {
        toastTitle = "🔑 Authentication Failed";
        toastDescription = "Invalid API key. Get your key from fal.ai and set FAL_KEY environment variable.";
      } else if (errorMessage.includes('Internal Server Error')) {
        toastTitle = "⚠️ Server Error";
        toastDescription = "Check the backend console logs for detailed error information.";
      }
      
      toast({ 
        title: toastTitle, 
        description: toastDescription, 
        variant: "destructive" 
      });
    } finally {
      setGeneratingVideoBlockKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-card flex flex-col">
      <header className="border-b border-border px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg">
            <X size={20} className="text-muted-foreground" />
          </button>
          <h2 className="font-bold text-lg text-foreground">{isEditing ? "Edit Training" : "Create New Training"}</h2>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1 ? "bg-primary text-primary-foreground" : step === i + 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > i + 1 ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border mx-2" />}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 rounded-xl font-medium border border-border text-foreground hover:bg-secondary transition-all active:scale-95"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step === 1) {
                if (!validateStep1()) {
                  toast({ title: "Please fix the errors below", variant: "destructive" });
                  return;
                }
              }
              step < 3 ? setStep(step + 1) : handlePublish();
            }}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all active:scale-95"
          >
            {step === 3 ? (isEditing ? "Save Changes" : "Publish Training") : "Continue"}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-12 max-w-3xl mx-auto w-full">
        {isLoadingEdit ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="ml-3 text-muted-foreground font-medium">Loading training data...</span>
          </div>
        ) : (
        <>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Training Title */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Training Title <span className="text-red-500">*</span>
              </label>
              <input 
                value={title} 
                onChange={(e) => {
                  setTitle(e.target.value);
                  setValidationErrors(prev => ({ ...prev, title: undefined }));
                }} 
                type="text" 
                placeholder="e.g. Infection Control Basics" 
                className={`w-full p-3 rounded-xl border bg-background focus:ring-2 ring-ring/20 outline-none text-foreground ${
                  validationErrors.title ? 'border-red-500' : 'border-border'
                }`} 
                maxLength={TITLE_MAX_LENGTH}
              />
              {validationErrors.title && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                {title.length}/{TITLE_MAX_LENGTH} characters (minimum {TITLE_MIN_LENGTH})
              </p>
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Cover Image</label>
              <div className="space-y-3">
                {coverImage ? (
                  <div className="relative">
                    <img src={coverImage} alt="Cover" className="w-full max-h-64 object-contain rounded-xl border border-border bg-muted/20" />
                    <button
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <Upload size={32} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Upload cover image</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {validationErrors.coverImage && (
                  <p className="text-red-500 text-sm">{validationErrors.coverImage}</p>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Categories <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TRAINING_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategories((prev) =>
                        prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                      );
                      setValidationErrors(prev => ({ ...prev, categories: undefined }));
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      categories.includes(c.id)
                        ? `${c.colour.border} ${c.colour.bg} ${c.colour.text}`
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {validationErrors.categories && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.categories}</p>
              )}
            </div>

            {/* Languages Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                Languages <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {/* Selected languages chips */}
                {selectedLangs.map((code) => {
                  const lang = LANGUAGES.find(l => l.code === code);
                  if (!lang) return null;
                  return (
                    <div key={code} className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                      <button
                        onClick={() => toggleLang(code)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                
                {/* Add language dropdown */}
                <div className="relative">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleLang(e.target.value);
                        e.target.value = ""; // Reset select
                      }
                    }}
                    className="appearance-none bg-border/20 hover:bg-border/40 text-muted-foreground px-3 py-1.5 rounded-full text-sm border-2 border-dashed border-border hover:border-primary/50 transition-all cursor-pointer pr-8"
                  >
                    <option value="">+ Add Language</option>
                    {LANGUAGES.filter(lang => !selectedLangs.includes(lang.code)).map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                  </select>
                  <Plus size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              {validationErrors.languages && (
                <p className="text-red-500 text-sm mt-2">{validationErrors.languages}</p>
              )}
            </div>

            {/* Assign to User Groups */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">
                <Users size={16} className="inline mr-2" />
                Assign to Groups
              </label>
              <div className="space-y-2">
                {USER_GROUPS.map((group) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-accent"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border ${group.color}`}>
                        {group.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {getAssignedStaffCount()} staff member{getAssignedStaffCount() !== 1 ? 's' : ''} will be assigned
              </p>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={generateDescription}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
              <textarea 
                value={description} 
                onChange={(e) => {
                  setDescription(e.target.value);
                  setValidationErrors(prev => ({ ...prev, description: undefined }));
                }} 
                rows={4} 
                className={`w-full p-3 rounded-xl border bg-background outline-none text-foreground ${
                  validationErrors.description ? 'border-red-500' : 'border-border'
                }`} 
                placeholder="What will staff learn? Write a high-level topic and use AI to expand it..." 
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
              <p className="text-muted-foreground text-xs mt-1">
                {description.length}/{DESCRIPTION_MAX_LENGTH} characters (minimum {DESCRIPTION_MIN_LENGTH})
              </p>
              {aiSuggestion && (
                <div className="mt-3 border-2 border-primary/30 bg-accent rounded-2xl p-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-primary shrink-0" />
                      <span className="text-sm font-bold text-foreground">AI Suggestion</span>
                    </div>
                    <button onClick={() => setAiSuggestion("")} className="p-1 hover:bg-secondary rounded text-muted-foreground shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{aiSuggestion}</p>
                  <button
                    onClick={() => { 
                      setDescription(aiSuggestion); 
                      setAiSuggestion(""); 
                      setValidationErrors(prev => ({ ...prev, description: undefined }));
                    }}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95"
                  >
                    Use This Description
                  </button>
                </div>
              )}
              {isGenerating && !aiSuggestion && (
                <div className="mt-3 border border-border rounded-2xl p-5 space-y-2">
                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                  <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            {/* Debug Panel - Remove this after testing */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">🐛 Debug Info (Remove after testing)</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <strong>Cover Image:</strong> {coverImage ? '✅ Set' : '❌ Missing'}
                </div>
                <div>
                  <strong>Image Length:</strong> {coverImage?.length || 0}
                </div>
                <div>
                  <strong>Image Type:</strong> {coverImage?.startsWith('data:') ? 'Base64' : coverImage ? 'URL' : 'None'}
                </div>
                <div>
                  <strong>Current Step:</strong> {step}
                </div>
              </div>
              {coverImage && (
                <div className="mt-2">
                  <strong>Image Preview:</strong>
                  <img src={coverImage} alt="Debug" className="w-16 h-16 object-cover rounded mt-1" />
                </div>
              )}
            </div>
            {/* AI generate structure banner */}
            <div className="bg-accent border border-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  Generate Structure with AI
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Auto-create topics and generate all content (text, quiz, image & video suggestions) automatically.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!title && !description && categories.length === 0) {
                    toast({ title: "Add a title, categories, or description first", variant: "destructive" });
                    return;
                  }
                  setIsGeneratingStructure(true);
                  try {
                    const { data, error } = await db.functions.invoke("generate-structure", {
                      body: { title, categories: categories.join(", "), description },
                    });
                    if (error) throw error;
                    if (data?.error) throw new Error(data.error);
                    if (data?.topics?.length) {
                      const generated: Topic[] = data.topics.map((t: { title: string; text: string }, i: number) => ({
                        id: Date.now() + i,
                        title: t.title,
                        hook: "",
                        keyLearningPoints: [],
                        script: "",
                        callToAction: "",
                        duration: "",
                        priority: "",
                        content: [{ type: "text" as const, value: t.text }],
                      }));
                      setTopics(generated);
                      setActiveTopicId(generated[0]?.id ?? null);
                      toast({ title: `Generated ${generated.length} topics — now auto-generating content...` });
                      setIsGeneratingStructure(false);
                      // Auto-generate full content for each topic sequentially
                      autoGenerateAllTopics(generated);
                    }
                  } catch (e: any) {
                    toast({ title: "Failed to generate structure", description: e.message, variant: "destructive" });
                    setIsGeneratingStructure(false);
                  }
                }}
                disabled={isGeneratingStructure || autoGeneratingTopicIds.size > 0}
                className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-primary/90 transition-all active:scale-95 shrink-0 flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingStructure || autoGeneratingTopicIds.size > 0 ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGeneratingStructure ? "Generating structure..." : autoGeneratingTopicIds.size > 0 ? `Generating content (${autoGeneratingTopicIds.size} remaining)...` : "Generate"}
              </button>
            </div>

            {isGeneratingStructure && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-card">
                    <div className="h-4 bg-muted rounded animate-pulse w-6" />
                    <div className="h-4 bg-muted rounded animate-pulse flex-1" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">Topics</h3>
              <button
                onClick={() => {
                  const id = Date.now();
                  setTopics((prev) => [...prev, { id, title: "", hook: "", keyLearningPoints: [], script: "", callToAction: "", duration: "", priority: "", content: [] }]);
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={14} /> Add Topic
              </button>
            </div>

            {topics.map((topic, idx) => {
              const isExpanded = activeTopicId === topic.id;
              const quizBlock = topic.content.find((b) => b.type === "quiz");
              const hasRichContent = topic.script;
              const isAutoGenerating = autoGeneratingTopicIds.has(topic.id);
              return (
                <div key={topic.id} className="border-2 border-border rounded-2xl overflow-hidden">
                  {/* Topic header */}
                  <div className="flex items-center gap-3 p-4 bg-card">
                    <button onClick={() => setActiveTopicId(isExpanded ? null : topic.id)} className="shrink-0">
                      {isExpanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
                    </button>
                    <span className="text-sm font-bold text-muted-foreground w-6">{idx + 1}.</span>
                    <input
                      value={topic.title}
                      onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                      placeholder="Topic title..."
                      className="flex-1 bg-transparent outline-none text-foreground font-medium"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Auto-generating indicator */}
                    {isAutoGenerating && (
                      <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
                        <Loader2 size={12} className="animate-spin" /> Generating...
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">
                      {hasRichContent ? "✓ Content" : `${topic.content.length} block${topic.content.length !== 1 ? "s" : ""}`}
                    </span>
                    {topics.length > 1 && (
                      <button
                        onClick={() => setTopics((prev) => prev.filter((t) => t.id !== topic.id))}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="p-4 border-t border-border space-y-5 bg-background">
                      {/* AI Propose All (manual re-generate) */}
                      <div className="bg-accent/50 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-primary shrink-0" />
                          <div>
                            <span className="text-sm font-semibold text-foreground">Regenerate Content</span>
                            <p className="text-xs text-muted-foreground">Re-generate script and quiz for this topic</p>
                          </div>
                        </div>
                        <button
                          onClick={() => generateAllContent(topic.id)}
                          disabled={generatingAllTopicId === topic.id || isAutoGenerating}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                        >
                          {(generatingAllTopicId === topic.id || isAutoGenerating) ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {(generatingAllTopicId === topic.id || isAutoGenerating) ? "Generating..." : "Regenerate"}
                        </button>
                      </div>

                      {(generatingAllTopicId === topic.id || isAutoGenerating) && !hasRichContent && (
                        <div className="space-y-3">
                          {["Script", "Quiz"].map((label) => (
                            <div key={label} className="p-4 rounded-xl border border-border bg-card space-y-2">
                              <div className="h-3 bg-muted rounded animate-pulse w-20" />
                              <div className="h-3 bg-muted rounded animate-pulse w-full" />
                              <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                            </div>
                          ))}
                        </div>
                      )}


                      {/* Script */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            <Clapperboard size={12} /> Script
                          </label>
                          <button
                            onClick={async () => {
                              if (!topic.title) {
                                toast({ title: "Please name this topic first", variant: "destructive" });
                                return;
                              }
                              setGeneratingTopicId(topic.id);
                              setTopicAiSuggestion(null);
                              try {
                                const { data, error } = await db.functions.invoke("generate-topic-text", {
                                  body: { topicTitle: topic.title, trainingTitle: title, categories: categories.join(", ") },
                                });
                                if (error) throw error;
                                if (data?.error) throw new Error(data.error);
                                setTopicAiSuggestion({ topicId: topic.id, text: data.suggestion || "" });
                              } catch (e: any) {
                                toast({ title: "Failed to generate script", description: e.message, variant: "destructive" });
                              } finally {
                                setGeneratingTopicId(null);
                              }
                            }}
                            disabled={generatingTopicId === topic.id}
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                          >
                            {generatingTopicId === topic.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            {generatingTopicId === topic.id ? "Generating..." : "AI Suggest"}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">Include [VISUAL: description] cues for what should appear on screen.</p>
                        <textarea
                          value={topic.script}
                          onChange={(e) => updateTopic(topic.id, { script: e.target.value })}
                          rows={8}
                          placeholder={"[VISUAL: Warm welcome montage]\n\nNARRATOR: Welcome to the team. Every person who walks through these doors...\n\n[VISUAL: Staff working together]\n\nAs a healthcare professional, you bring perspectives..."}
                          className="w-full p-3 rounded-xl border border-border bg-card outline-none text-foreground text-sm font-mono leading-relaxed"
                        />
                        {generatingTopicId === topic.id && !topicAiSuggestion && (
                          <div className="mt-2 space-y-2">
                            <div className="h-3 bg-muted rounded animate-pulse w-full" />
                            <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                            <div className="h-3 bg-muted rounded animate-pulse w-3/5" />
                          </div>
                        )}
                        {topicAiSuggestion && topicAiSuggestion.topicId === topic.id && (
                          <div className="mt-2 border-2 border-primary/30 bg-accent rounded-xl p-4 animate-fade-in">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <Sparkles size={14} className="text-primary" />
                                <span className="text-xs font-bold text-foreground">AI Suggestion</span>
                              </div>
                              <button onClick={() => setTopicAiSuggestion(null)} className="p-0.5 hover:bg-secondary rounded text-muted-foreground">
                                <X size={12} />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-3 whitespace-pre-wrap">{topicAiSuggestion.text}</p>
                            <button
                              onClick={() => {
                                updateTopic(topic.id, { script: topicAiSuggestion.text });
                                setTopicAiSuggestion(null);
                              }}
                              className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-all active:scale-95"
                            >
                              Use This Script
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border pt-4">
                        <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Assessment</span>
                      </div>

                      {/* Content blocks (image, video, quiz, extra text) */}
                      {topic.content.map((block, bIdx) => (
                        <div key={bIdx} className="relative group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                              {block.type === "text" ? "Text" : block.type === "image" ? "Image" : block.type === "video" ? "Video" : "Quiz"}
                            </span>
                            <button
                              onClick={() =>
                                setTopics((prev) =>
                                  prev.map((t) =>
                                    t.id === topic.id
                                      ? { ...t, content: t.content.filter((_, i) => i !== bIdx) }
                                      : t
                                  )
                                )
                              }
                              className="p-1 hover:bg-secondary rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {block.type === "text" && (
                            <textarea
                              value={block.value}
                              onChange={(e) => updateTopicBlock(topic.id, bIdx, { value: e.target.value })}
                              rows={4}
                              className="w-full p-3 rounded-xl border border-border bg-card outline-none text-foreground text-sm"
                              placeholder="Additional text content..."
                            />
                          )}

                          {block.type === "video" && (() => {
                            const blockKey = `${topic.id}-${bIdx}`;
                            const isGeneratingVideo = generatingVideoBlockKey === blockKey;
                            const videoError = videoGenerationErrors[blockKey];
                            
                            return (
                              <div className="space-y-3">
                                {/* Video preview or placeholder */}
                                {block.value ? (
                                  <div className="relative">
                                    <video 
                                      controls 
                                      src={block.value} 
                                      className="w-full aspect-video rounded-lg border border-border bg-black"
                                      onError={(e) => {
                                        console.error('Video failed to load:', block.value);
                                        setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: 'Video failed to load. Please check the URL.' }));
                                      }}
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                    <button
                                      onClick={() => updateTopicBlock(topic.id, bIdx, { value: '' })}
                                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ) : isGeneratingVideo ? (
                                  <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center border border-border animate-fade-in">
                                    <Loader2 size={48} className="text-primary animate-spin mb-3" />
                                    <p className="text-sm font-medium text-foreground mb-1">Generating video...</p>
                                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                                      This may take a few minutes. The video will appear here when ready.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {block.video_brief && (
                                      <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-center justify-between animate-fade-in">
                                        <div className="flex items-center gap-3">
                                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            <Video size={24} className="text-muted-foreground" />
                                          </div>
                                          <div>
                                            <span className="text-xs font-medium text-muted-foreground">Video ready to generate</span>
                                            <p className="text-xs text-muted-foreground/60 mt-0.5">Generate a talking video from your script</p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => generateVideo(topic.id, bIdx)}
                                          disabled={!topic.script || isGeneratingVideo}
                                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                        >
                                          <Sparkles size={14} />
                                          Generate Video
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center border border-border">
                                      <Video size={48} className="text-muted-foreground mb-3" />
                                      <p className="text-sm font-medium text-foreground mb-1">Generate Video</p>
                                      <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
                                        Create a talking video from your script using AI
                                      </p>
                                      <button
                                        onClick={() => generateVideo(topic.id, bIdx)}
                                        disabled={!topic.script || isGeneratingVideo}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                      >
                                        <Sparkles size={16} />
                                        Generate Video
                                      </button>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Error message */}
                                {videoError && (
                                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-fade-in">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                        <X size={16} className="text-red-600 dark:text-red-400" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Video Generation Failed</p>
                                        <p className="text-xs text-red-600 dark:text-red-300">{videoError}</p>
                                        <button
                                          onClick={() => setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: '' }))}
                                          className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline mt-2"
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <input
                                  value={block.value}
                                  onChange={(e) => updateTopicBlock(topic.id, bIdx, { value: e.target.value })}
                                  placeholder="Or paste video URL manually..."
                                  className="w-full p-3 rounded-xl border border-border bg-card outline-none text-foreground text-sm"
                                />
                              </div>
                            );
                          })()}

                          {block.type === "image" && (() => {
                            const blockKey = `${topic.id}-${bIdx}`;
                            const isGeneratingImg = generatingImageBlockKey === blockKey;
                            return (
                              <div className="space-y-3">
                                {block.image_prompt && !block.value && !imagePrompt[blockKey] && (
                                  <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-center justify-between animate-fade-in">
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <Image size={24} className="text-muted-foreground" />
                                      </div>
                                      <div>
                                        <span className="text-xs font-medium text-muted-foreground">Image ready to generate</span>
                                        <p className="text-xs text-muted-foreground/60 mt-0.5">AI will create an illustration for this topic</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setImagePrompt((prev) => ({ ...prev, [blockKey]: block.image_prompt || "" }))}
                                      className="text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                                    >
                                      Generate →
                                    </button>
                                  </div>
                                )}
                                <input
                                  value={block.value}
                                  onChange={(e) => updateTopicBlock(topic.id, bIdx, { value: e.target.value })}
                                  placeholder="Paste image URL or generate with AI below..."
                                  className="w-full p-3 rounded-xl border border-border bg-card outline-none text-foreground text-sm"
                                />
                                {block.value && (block.value.startsWith("data:") || block.value.startsWith("http")) && (
                                  <img src={block.value} alt="Preview" className="rounded-xl border border-border max-h-64 object-contain" />
                                )}
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Generate image with AI</label>
                                    <input
                                      value={imagePrompt[blockKey] || ""}
                                      onChange={(e) => setImagePrompt((prev) => ({ ...prev, [blockKey]: e.target.value }))}
                                      placeholder="e.g. A care worker helping an elderly person wash hands"
                                      className="w-full p-2.5 rounded-lg border border-border bg-card outline-none text-foreground text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const prompt = imagePrompt[blockKey];
                                      if (!prompt?.trim()) {
                                        toast({ title: "Enter an image description first", variant: "destructive" });
                                        return;
                                      }
                                      setGeneratingImageBlockKey(blockKey);
                                      try {
                                        const { data, error } = await db.functions.invoke("generate-image", {
                                          body: { prompt: `Training illustration: ${prompt}. Professional, clean, suitable for healthcare training materials.` },
                                        });
                                        if (error) throw error;
                                        if (data?.error) throw new Error(data.error);
                                        if (data?.imageUrl) {
                                          updateTopicBlock(topic.id, bIdx, { value: data.imageUrl });
                                        }
                                      } catch (e: any) {
                                        toast({ title: "Failed to generate image", description: e.message, variant: "destructive" });
                                      } finally {
                                        setGeneratingImageBlockKey(null);
                                      }
                                    }}
                                    disabled={isGeneratingImg}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                                  >
                                    {isGeneratingImg ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {isGeneratingImg ? "Generating..." : "Generate"}
                                  </button>
                                </div>
                                {isGeneratingImg && (
                                  <div className="h-40 bg-muted rounded-xl animate-pulse flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">Generating image...</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {block.type === "quiz" && (
                            <div className="space-y-3">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => generateTopicQuiz(topic.id)}
                                  disabled={generatingQuizTopicId === topic.id}
                                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                >
                                  {generatingQuizTopicId === topic.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                  {generatingQuizTopicId === topic.id ? "Generating..." : "AI Generate Questions"}
                                </button>
                              </div>
                              {generatingQuizTopicId === topic.id && !(block.quiz?.length) && (
                                <div className="space-y-2">
                                  <div className="h-3 bg-muted rounded animate-pulse w-full" />
                                  <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
                                </div>
                              )}
                              {(block.quiz || []).map((q, qIdx) => (
                                <div key={q.id} className="bg-secondary rounded-xl p-4 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-muted-foreground">Question {qIdx + 1}</span>
                                    <button
                                      onClick={() =>
                                        updateTopicBlock(topic.id, bIdx, { quiz: (block.quiz || []).filter((_, qi) => qi !== qIdx) })
                                      }
                                      className="p-1 hover:bg-card rounded text-muted-foreground"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <input
                                    value={q.text}
                                    onChange={(e) =>
                                      updateTopicBlock(topic.id, bIdx, {
                                        quiz: (block.quiz || []).map((qq, qi) => (qi === qIdx ? { ...qq, text: e.target.value } : qq)),
                                      })
                                    }
                                    placeholder="Enter your question..."
                                    className="w-full p-2.5 rounded-lg border border-border bg-card outline-none text-sm text-foreground"
                                  />
                                  <div className="space-y-1.5">
                                    {q.options.map((opt, oIdx) => (
                                      <div key={oIdx} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name={`quiz-${topic.id}-${qIdx}`}
                                          checked={q.correctIndex === oIdx}
                                          onChange={() =>
                                            updateTopicBlock(topic.id, bIdx, {
                                              quiz: (block.quiz || []).map((qq, qi) => (qi === qIdx ? { ...qq, correctIndex: oIdx } : qq)),
                                            })
                                          }
                                          className="w-3.5 h-3.5 accent-primary"
                                        />
                                        <input
                                          value={opt}
                                          onChange={(e) =>
                                            updateTopicBlock(topic.id, bIdx, {
                                              quiz: (block.quiz || []).map((qq, qi) =>
                                                qi === qIdx ? { ...qq, options: qq.options.map((o, oi) => (oi === oIdx ? e.target.value : o)) } : qq
                                              ),
                                            })
                                          }
                                          placeholder={`Option ${oIdx + 1}`}
                                          className="flex-1 p-2 rounded-lg border border-border bg-card outline-none text-xs text-foreground"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() =>
                                  updateTopicBlock(topic.id, bIdx, {
                                    quiz: [...(block.quiz || []), { id: (block.quiz?.length || 0) + 1, text: "", options: ["", "", "", ""], correctIndex: 0 }],
                                  })
                                }
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                + Add Question
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add quiz button */}
                      {!quizBlock && (
                        <div className="pt-2">
                          <button
                            onClick={() =>
                              setTopics((prev) =>
                                prev.map((t) => (t.id === topic.id ? { ...t, content: [...t.content, { type: "quiz", value: "", quiz: [] }] } : t))
                              )
                            }
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                          >
                            <HelpCircle size={16} /> Add Quiz
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}


        {/* Step 3: Preview */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Eye size={22} className="text-primary" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Training Preview</h3>
                <p className="text-sm text-muted-foreground">Review your training before assigning to staff.</p>
              </div>
            </div>

            {/* Training summary card */}
            <div className="bg-accent border border-primary/20 rounded-2xl p-6 space-y-3">
              <h4 className="text-xl font-bold text-foreground">{title || "Untitled Training"}</h4>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span key={c} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{c}</span>
                  ))}
                </div>
              )}
              {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                <span>{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
                <span>{selectedLangs.length} language{selectedLangs.length !== 1 ? "s" : ""}</span>
                <span>{allQuestions.filter((q) => q.text.trim()).length} quiz question{allQuestions.filter((q) => q.text.trim()).length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Topics preview */}
            {topics.map((topic, idx) => {
              const isOpen = previewTopicId === topic.id;
              const quizBlock = topic.content.find((b) => b.type === "quiz");
              const imageBlock = topic.content.find((b) => b.type === "image");
              const videoBlock = topic.content.find((b) => b.type === "video");

              return (
                <div key={topic.id} className="border border-border rounded-2xl overflow-hidden bg-card">
                  <button
                    onClick={() => setPreviewTopicId(isOpen ? null : topic.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    {isOpen ? <ChevronDown size={16} className="text-muted-foreground shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                    <span className="text-sm font-bold text-primary w-6">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="font-semibold text-foreground flex-1">{topic.title || "Untitled Topic"}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border p-5 space-y-5 bg-background">
                      {/* Video Section */}
                      <div className="bg-card border border-border rounded-xl p-4">
                        <h5 className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">
                          <div className="flex items-center gap-1.5">
                            <Video size={12} /> Video
                          </div>
                          {(() => {
                            const blockKey = `${topic.id}-preview`;
                            const isGeneratingVideo = generatingVideoBlockKey === blockKey;
                            const videoError = videoGenerationErrors[blockKey];
                            const videoBlock = topic.content.find((b) => b.type === "video");
                            
                            if (!videoBlock?.value && !isGeneratingVideo && topic.script) {
                              return (
                                <button
                                  onClick={() => generateVideo(topic.id)}
                                  disabled={isGeneratingVideo || !coverImage}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                                  title={!coverImage ? 'Upload an image in Step 1 first' : 'Generate video with your uploaded image'}
                                >
                                  <Sparkles size={12} />
                                  Generate Video
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </h5>
                        
                        {(() => {
                          const blockKey = `${topic.id}-preview`;
                          const isGeneratingVideo = generatingVideoBlockKey === blockKey;
                          const videoError = videoGenerationErrors[blockKey];
                          const videoBlock = topic.content.find((b) => b.type === "video");
                          
                          if (videoBlock?.value) {
                            // Show generated video
                            return (
                              <video 
                                controls 
                                src={videoBlock.value} 
                                className="w-full aspect-video rounded-lg border border-border bg-black"
                                onError={(e) => {
                                  console.error('Video failed to load:', videoBlock.value);
                                  setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: 'Video failed to load. Please check the URL.' }));
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            );
                          } else if (isGeneratingVideo) {
                            // Show loading state
                            return (
                              <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center border border-border animate-fade-in">
                                <Loader2 size={48} className="text-primary animate-spin mb-3" />
                                <p className="text-sm font-medium text-foreground mb-1">Generating video...</p>
                                <p className="text-xs text-muted-foreground text-center max-w-sm">
                                  Creating talking video from script. This may take a few minutes.
                                </p>
                              </div>
                            );
                          } else {
                            // Show placeholder with generate button
                            return (
                              <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center border border-border">
                                <Video size={48} className="text-muted-foreground mb-3" />
                                <p className="text-sm font-medium text-foreground mb-1">
                                  {topic.script ? "Ready to generate video" : "Video will be generated"}
                                </p>
                                <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
                                  {topic.script 
                                    ? "Create a talking video from your script using AI" 
                                    : "A video for this topic will be automatically created based on the script content"
                                  }
                                </p>
                                {topic.script && (
                                  <div className="text-center space-y-2">
                                    <button
                                      onClick={() => generateVideo(topic.id)}
                                      disabled={isGeneratingVideo || !coverImage}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Sparkles size={16} />
                                      Generate Video
                                    </button>
                                    {!coverImage && (
                                      <p className="text-xs text-red-500">Upload an image in Step 1 first</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Image: {coverImage ? '✅ Ready' : '❌ Missing'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        })()}
                        
                        {/* Error message for preview */}
                        {(() => {
                          const blockKey = `${topic.id}-preview`;
                          const videoError = videoGenerationErrors[blockKey];
                          
                          if (videoError) {
                            return (
                              <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 animate-fade-in">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                                    <X size={16} className="text-red-600 dark:text-red-400" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Video Generation Failed</p>
                                    <p className="text-xs text-red-600 dark:text-red-300">{videoError}</p>
                                    <div className="flex gap-2 mt-2">
                                      <button
                                        onClick={() => generateVideo(topic.id)}
                                        className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
                                      >
                                        Retry
                                      </button>
                                      <button
                                        onClick={() => setVideoGenerationErrors(prev => ({ ...prev, [blockKey]: '' }))}
                                        className="text-xs font-medium text-red-700 dark:text-red-300 hover:underline"
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Script with visual cues parsing */}
                      {topic.script && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">
                            <Clapperboard size={12} /> Script
                          </h5>
                          <div className="text-sm text-foreground leading-relaxed space-y-3">
                            {topic.script.split(/(\[VISUAL:[^\]]+\])/).map((part, partIdx) => {
                              if (part.match(/^\[VISUAL:/)) {
                                return (
                                  <div key={partIdx} className="flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-xs font-medium">
                                    <Eye size={14} className="shrink-0" />
                                    <span>{part.replace(/^\[VISUAL:\s*/, "").replace(/\]$/, "")}</span>
                                  </div>
                                );
                              }
                              return part.trim() ? (
                                <p key={partIdx} className="whitespace-pre-wrap">{part.trim()}</p>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assessment Section Header */}
                      {topic.content.some(b => b.type === "quiz") && (
                        <div className="border-t border-border pt-4">
                          <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Assessment</span>
                        </div>
                      )}


                      {/* Quiz preview */}
                      {quizBlock?.quiz && quizBlock.quiz.length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-4">
                          <h5 className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground tracking-wider mb-3">
                            <HelpCircle size={12} /> Quiz ({quizBlock.quiz.length} question{quizBlock.quiz.length !== 1 ? "s" : ""})
                          </h5>
                          <div className="space-y-4">
                            {quizBlock.quiz.map((q, qIdx) => (
                              <div key={q.id} className="bg-secondary/50 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-semibold text-foreground">Q{qIdx + 1}: {q.text}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${
                                        oIdx === q.correctIndex
                                          ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                                          : "border-border text-muted-foreground bg-background"
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                        oIdx === q.correctIndex ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                      {oIdx === q.correctIndex && <Check size={14} className="ml-auto shrink-0" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Empty state if no content */}
                      {!topic.script && (!quizBlock?.quiz || quizBlock.quiz.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Eye size={32} className="mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No content generated for this topic yet.</p>
                          <p className="text-xs mt-1">Go back to Content step to add or generate content.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        </>
        )}
      </main>
    </div>
  );
}
