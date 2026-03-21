import { QuizQuestion, CATEGORIES } from "@/data/carelearn-data";

// Pre-built question banks by category for auto-generation
const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  "Infection Control": [
    { id: 1, text: "How long should you scrub your hands with soap and water?", options: ["5 seconds", "10 seconds", "20 seconds", "1 minute"], correctIndex: 2 },
    { id: 2, text: "When must you perform hand hygiene?", options: ["Only before meals", "Before and after patient contact", "Only when visibly dirty", "Once per shift"], correctIndex: 1 },
    { id: 3, text: "Which PPE should be worn when handling bodily fluids?", options: ["Only gloves", "Gloves and apron", "Gloves, apron, and eye protection", "No PPE needed"], correctIndex: 2 },
    { id: 4, text: "What is the correct order for donning PPE?", options: ["Gloves, gown, mask", "Gown, mask, gloves", "Mask, gloves, gown", "Any order is fine"], correctIndex: 1 },
    { id: 5, text: "How should clinical waste be disposed of?", options: ["Regular bin", "Yellow clinical waste bag", "Recycling bin", "Flushed down the drain"], correctIndex: 1 },
  ],
  "Patient Handling": [
    { id: 1, text: "What should you do before lifting a patient?", options: ["Start lifting immediately", "Assess the load and plan the move", "Call a doctor", "Skip if in a hurry"], correctIndex: 1 },
    { id: 2, text: "What is the correct posture for manual lifting?", options: ["Bend at the waist", "Keep back straight and bend knees", "Twist while lifting", "Lean forward"], correctIndex: 1 },
    { id: 3, text: "When should a mechanical hoist be used?", options: ["Never", "Only for heavy patients", "When a patient cannot bear their own weight", "Only during day shifts"], correctIndex: 2 },
    { id: 4, text: "What is the first step before moving a patient?", options: ["Grab and pull", "Communicate with the patient", "Call a supervisor", "Lock the brakes"], correctIndex: 1 },
    { id: 5, text: "How often should moving and handling risk assessments be reviewed?", options: ["Never", "Annually or when needs change", "Only after an incident", "Every 5 years"], correctIndex: 1 },
  ],
  "Fire Safety": [
    { id: 1, text: "What is the first action when discovering a fire?", options: ["Fight the fire", "Activate the fire alarm", "Open windows", "Continue working"], correctIndex: 1 },
    { id: 2, text: "Can you use the elevator during a fire evacuation?", options: ["Yes, always", "Only when going down", "Never", "Only for disabled persons"], correctIndex: 2 },
    { id: 3, text: "What does the 'R' in RACE stand for?", options: ["Run", "Rescue", "Report", "Reduce"], correctIndex: 1 },
    { id: 4, text: "Where should you assemble after evacuating?", options: ["Inside the building", "At the designated assembly point", "In the parking lot", "Anywhere outside"], correctIndex: 1 },
    { id: 5, text: "How often should fire drills be conducted?", options: ["Once per year", "Twice per year minimum", "Only after an incident", "Never"], correctIndex: 1 },
  ],
  "GDPR": [
    { id: 1, text: "What does GDPR stand for?", options: ["General Data Protection Regulation", "Global Data Privacy Rules", "General Digital Privacy Regulation", "Government Data Protection Rules"], correctIndex: 0 },
    { id: 2, text: "How long can you keep patient data without a lawful basis?", options: ["Forever", "As long as needed", "Only as long as necessary for the purpose", "5 years maximum"], correctIndex: 2 },
    { id: 3, text: "What must you do if there is a data breach?", options: ["Ignore it", "Report it within 72 hours", "Fix it yourself", "Wait for the patient to notice"], correctIndex: 1 },
    { id: 4, text: "Can you share patient data with family without consent?", options: ["Yes, always", "Only in emergencies", "No, unless legally required or consented", "Only by phone"], correctIndex: 2 },
    { id: 5, text: "Where should paper records with patient data be stored?", options: ["On the desk", "In a locked cabinet", "In the bin", "On the noticeboard"], correctIndex: 1 },
  ],
  "Medication": [
    { id: 1, text: "What are the '5 Rights' of medication administration?", options: ["Right patient, drug, dose, route, time", "Right doctor, nurse, patient, drug, dose", "Right form, color, size, shape, label", "Right ward, bed, chart, drug, time"], correctIndex: 0 },
    { id: 2, text: "What should you do if a patient refuses medication?", options: ["Force them to take it", "Document it and inform the prescriber", "Crush it in their food", "Ignore the refusal"], correctIndex: 1 },
    { id: 3, text: "How should controlled drugs be stored?", options: ["In a regular cupboard", "In a double-locked controlled drugs cabinet", "On the patient's bedside table", "In the fridge"], correctIndex: 1 },
    { id: 4, text: "What is a medication error?", options: ["Giving the wrong dose only", "Any deviation from the prescriber's order", "Only giving the wrong drug", "Only a missed dose"], correctIndex: 1 },
    { id: 5, text: "When should you check a patient's allergy status?", options: ["Never", "Only on admission", "Before every medication administration", "Once a year"], correctIndex: 2 },
  ],
  "Other": [
    { id: 1, text: "What is the primary duty of care?", options: ["To follow orders", "To ensure the safety and well-being of patients", "To complete paperwork", "To save costs"], correctIndex: 1 },
    { id: 2, text: "How should you report a safeguarding concern?", options: ["Tell a colleague informally", "Follow the facility's safeguarding policy", "Ignore it", "Post it online"], correctIndex: 1 },
    { id: 3, text: "What is person-centred care?", options: ["Treating everyone the same", "Tailoring care to individual needs and preferences", "Only doing what the family wants", "Following a strict routine"], correctIndex: 1 },
    { id: 4, text: "When should incidents be reported?", options: ["Only if serious", "As soon as possible after they occur", "At the end of the week", "Only if asked"], correctIndex: 1 },
    { id: 5, text: "What is informed consent?", options: ["Any verbal agreement", "Understanding and agreeing to a procedure with full information", "Signing a form without reading", "A doctor's permission"], correctIndex: 1 },
  ],
};

/**
 * Generate quiz questions automatically based on training category.
 * Picks `count` random questions from the bank, shuffled.
 */
export function generateAutoQuiz(category: string, count: number = 1): QuizQuestion[] {
  const bank = QUESTION_BANK[category] || QUESTION_BANK["Other"];
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, i) => ({
    ...q,
    id: i + 1,
  }));
}

/**
 * Get all available categories that have question banks
 */
export function getAvailableCategories(): string[] {
  return Object.keys(QUESTION_BANK);
}
