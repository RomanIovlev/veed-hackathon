export interface Language {
  code: string;
  label: string;
  flag: string;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  email: string;
  lang: string;
  flag: string;
  completed: number;
  assigned: number;
  lastActive: string;
}

export interface Training {
  id: number;
  title: string;
  description: string;
  categories: string[];
  langs: string[];
  assigned: number;
  completed: number;
  status: "Active" | "Draft" | "Overdue";
  due: string;
  duration: number;
  questions: QuizQuestion[];
  notes: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "ro", label: "Romanian", flag: "🇷🇴" },
  { code: "tl", label: "Filipino", flag: "🇵🇭" },
  { code: "uk", label: "Ukrainian", flag: "🇺🇦" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcome: "Good morning",
    myTrainings: "My Trainings",
    start: "Start Quiz",
    todo: "To do",
    inprogress: "In progress",
    done: "Done",
    overdue: "Overdue",
    active: "Active",
    login: "Login",
    selectLanguage: "Select your language",
    name: "Full Name",
    pin: "4-Digit PIN",
    backToTrainings: "Back to My Trainings",
    certificateEarned: "Certificate Earned",
    validUntil: "Valid until Dec 2024",
    excellent: "Excellent work! You've successfully completed this training.",
    questionOf: "of",
    minutes: "MIN",
  },
  nl: {
    welcome: "Goedemorgen",
    myTrainings: "Mijn Trainingen",
    start: "Start de Quiz",
    todo: "Te doen",
    inprogress: "Bezig",
    done: "Klaar",
    overdue: "Te laat",
    active: "Actief",
    login: "Inloggen",
    selectLanguage: "Kies je taal",
    name: "Volledige naam",
    pin: "4-cijferige PIN",
    backToTrainings: "Terug naar mijn trainingen",
    certificateEarned: "Certificaat behaald",
    validUntil: "Geldig tot dec 2024",
    excellent: "Uitstekend werk! Je hebt deze training succesvol afgerond.",
    questionOf: "van",
    minutes: "MIN",
  },
  ro: {
    welcome: "Bună dimineața",
    myTrainings: "Instruirile Mele",
    start: "Începe Testul",
    todo: "De făcut",
    inprogress: "În curs",
    done: "Finalizat",
    overdue: "Întârziat",
    active: "Activ",
    login: "Autentificare",
    selectLanguage: "Selectați limba",
    name: "Numele complet",
    pin: "PIN cu 4 cifre",
    backToTrainings: "Înapoi la instruiri",
    certificateEarned: "Certificat obținut",
    validUntil: "Valabil până în dec 2024",
    excellent: "Excelent! Ați finalizat cu succes această instruire.",
    questionOf: "din",
    minutes: "MIN",
  },
  tl: {
    welcome: "Magandang umaga",
    myTrainings: "Aking mga Pagsasanay",
    start: "Simulan ang Pagsusulit",
    todo: "Gagawin",
    inprogress: "Ginagawa",
    done: "Tapos na",
    overdue: "Lagpas na",
    active: "Aktibo",
    login: "Mag-login",
    selectLanguage: "Piliin ang iyong wika",
    name: "Buong Pangalan",
    pin: "4 na digit na PIN",
    backToTrainings: "Bumalik sa mga Pagsasanay",
    certificateEarned: "Nakuha ang Sertipiko",
    validUntil: "May bisa hanggang Dis 2024",
    excellent: "Mahusay! Matagumpay mong natapos ang pagsasanay na ito.",
    questionOf: "sa",
    minutes: "MIN",
  },
};

export const INITIAL_STAFF: StaffMember[] = [
  { id: 1, name: "Maria Santos", role: "Carer", email: "maria@care.nl", lang: "tl", flag: "🇵🇭", completed: 2, assigned: 3, lastActive: "2h ago" },
  { id: 2, name: "Ana Popescu", role: "Senior Carer", email: "ana@care.nl", lang: "ro", flag: "🇷🇴", completed: 3, assigned: 3, lastActive: "1d ago" },
  { id: 3, name: "Dariya Kovalenko", role: "Nurse", email: "dariya@care.nl", lang: "uk", flag: "🇺🇦", completed: 1, assigned: 3, lastActive: "3h ago" },
  { id: 4, name: "Jan de Vries", role: "Manager", email: "jan@care.nl", lang: "nl", flag: "🇳🇱", completed: 3, assigned: 3, lastActive: "Now" },
  { id: 5, name: "Fatima Zahra", role: "Carer", email: "fatima@care.nl", lang: "ar", flag: "🇸🇦", completed: 0, assigned: 3, lastActive: "4d ago" },
];

export const INITIAL_TRAININGS: Training[] = [
  {
    id: 1,
    title: "Hand Hygiene Protocol",
    description: "Essential hand washing and sanitization procedures for infection prevention.",
    categories: ["Infection Control"],
    langs: ["en", "ro", "tl", "uk"],
    assigned: 12,
    completed: 8,
    status: "Active",
    due: "2024-12-01",
    duration: 12,
    notes: "Ensure you wash your hands for at least 20 seconds. Focus on the areas between fingers and under nails. Hand sanitizer is not a replacement for soap and water when hands are visibly soiled.",
    questions: [
      { id: 1, text: "How long should you scrub your hands with soap?", options: ["5 seconds", "10 seconds", "20 seconds", "1 minute"], correctIndex: 2 },
      { id: 2, text: "When should you wash your hands?", options: ["Only before meals", "Before and after patient contact", "Only when visibly dirty", "Once per shift"], correctIndex: 1 },
      { id: 3, text: "What is the correct water temperature?", options: ["Cold", "Lukewarm", "Very hot", "It doesn't matter"], correctIndex: 1 },
      { id: 4, text: "Which area is most commonly missed?", options: ["Palms", "Between fingers and thumbs", "Wrists", "Back of hand"], correctIndex: 1 },
      { id: 5, text: "Can hand sanitizer replace soap and water?", options: ["Always", "Never", "Only when hands are not visibly soiled", "Only in emergencies"], correctIndex: 2 },
    ],
  },
  {
    id: 2,
    title: "Manual Handling Techniques",
    description: "Proper lifting, moving, and positioning of patients to prevent injury.",
    categories: ["Patient Handling"],
    langs: ["en", "nl", "tl"],
    assigned: 15,
    completed: 14,
    status: "Active",
    due: "2024-11-20",
    duration: 18,
    notes: "Always assess the load before lifting. Use mechanical aids whenever possible. Never lift a patient alone if they cannot support their own weight.",
    questions: [
      { id: 1, text: "What should you do before lifting a patient?", options: ["Start lifting immediately", "Assess the load and plan", "Call a doctor", "Skip if in a hurry"], correctIndex: 1 },
      { id: 2, text: "What is the correct posture for lifting?", options: ["Bend at the waist", "Keep back straight, bend knees", "Twist while lifting", "Lean forward"], correctIndex: 1 },
      { id: 3, text: "When should you use a hoist?", options: ["Never", "Only for heavy patients", "When a patient cannot support their weight", "Only during the day"], correctIndex: 2 },
      { id: 4, text: "How many people for a two-person lift?", options: ["1", "2", "3", "4"], correctIndex: 1 },
      { id: 5, text: "What is the first step in moving a patient?", options: ["Grab and pull", "Communicate with the patient", "Call a supervisor", "Check the floor"], correctIndex: 1 },
    ],
  },
  {
    id: 3,
    title: "Fire Evacuation Procedure",
    description: "Emergency protocols for fire safety and building evacuation.",
    categories: ["Fire Safety"],
    langs: ["en", "de", "fr", "ro"],
    assigned: 20,
    completed: 5,
    status: "Overdue",
    due: "2024-10-15",
    duration: 15,
    notes: "In case of fire: activate the alarm, close doors, evacuate via marked routes, assemble at the meeting point. Never use elevators during a fire.",
    questions: [
      { id: 1, text: "What is the first thing to do when discovering a fire?", options: ["Fight the fire", "Activate the alarm", "Open windows", "Continue working"], correctIndex: 1 },
      { id: 2, text: "Can you use the elevator during a fire?", options: ["Yes, always", "Only going down", "Never", "Only if it's a small fire"], correctIndex: 2 },
      { id: 3, text: "Where is the assembly point?", options: ["Inside the building", "At the designated outdoor area", "In the parking lot", "Anywhere outside"], correctIndex: 1 },
      { id: 4, text: "What does RACE stand for?", options: ["Run, Alarm, Close, Extinguish", "Rescue, Alarm, Contain, Evacuate", "Run, Alert, Call, Exit", "Rescue, Act, Close, Exit"], correctIndex: 1 },
      { id: 5, text: "Who is responsible for fire safety?", options: ["Only the fire warden", "Only the manager", "Everyone", "Only maintenance"], correctIndex: 2 },
    ],
  },
];

export const CATEGORIES = [
  "Infection Control",
  "Patient Handling",
  "Fire Safety",
  "GDPR",
  "Medication",
  "Other",
];

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const USER_GROUPS: UserGroup[] = [
  {
    id: "carer",
    name: "Carers",
    description: "Front-line care staff providing direct patient care",
    icon: "👥",
    color: "bg-blue-100 text-blue-700 border-blue-200"
  },
  {
    id: "senior-carer",
    name: "Senior Carers",
    description: "Experienced carers with additional responsibilities",
    icon: "👨‍⚕️",
    color: "bg-green-100 text-green-700 border-green-200"
  },
  {
    id: "nurse",
    name: "Nurses",
    description: "Qualified nursing professionals",
    icon: "🩺",
    color: "bg-purple-100 text-purple-700 border-purple-200"
  },
  {
    id: "manager",
    name: "Managers",
    description: "Management and supervisory staff",
    icon: "👔",
    color: "bg-orange-100 text-orange-700 border-orange-200"
  },
  {
    id: "all-staff",
    name: "All Staff",
    description: "Everyone in the organization",
    icon: "🏢",
    color: "bg-gray-100 text-gray-700 border-gray-200"
  }
];
