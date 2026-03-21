export type TrainingCategory = {
  id: string;
  label: string;
  colour: {
    bg: string;
    text: string;
    border: string;
  };
};

export const TRAINING_CATEGORIES: TrainingCategory[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    colour: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  },
  {
    id: "infection-control",
    label: "Infection Control",
    colour: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  },
  {
    id: "health-and-safety",
    label: "Health & Safety",
    colour: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  },
  {
    id: "manual-handling",
    label: "Manual Handling",
    colour: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  },
  {
    id: "medication",
    label: "Medication",
    colour: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  },
  {
    id: "safeguarding",
    label: "Safeguarding",
    colour: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  },
  {
    id: "dementia-care",
    label: "Dementia Care",
    colour: { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  },
  {
    id: "end-of-life-care",
    label: "End of Life Care",
    colour: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  },
  {
    id: "fire-safety",
    label: "Fire Safety",
    colour: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  },
];

export const UNCATEGORISED: TrainingCategory = {
  id: "uncategorised",
  label: "Uncategorised",
  colour: { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" },
};

export const getCategoryById = (id: string): TrainingCategory =>
  TRAINING_CATEGORIES.find((c) => c.id === id) ?? UNCATEGORISED;
