import type { AiBenefit, AiMed, AiStat } from "../types/ai-prescription.types"

export const SMART_BENEFITS: AiBenefit[] = [
  {
    title: "Context-aware suggestions",
    desc: "AI reads past diagnoses, allergies & medications to suggest the safest drug regimen instantly.",
  },
  {
    title: "Auto-fill prescription template",
    desc: "Complete Rx, medicine, dosage, frequency, and duration, generated with one click from symptoms.",
  },
  {
    title: "Zero handwriting errors",
    desc: "Digital prescriptions eliminate illegible handwriting, improving pharmacy accuracy and patient safety.",
  },
  {
    title: "Save 15+ minutes per patient",
    desc: "Doctors spend more time on care, not paperwork. Prescription time drops from minutes to seconds.",
  },
]

export const VOICE_BENEFITS: AiBenefit[] = [
  { title: "Speak naturally", desc: "Dictate the prescription in your own words while you examine the patient." },
  { title: "Live transcription", desc: "Speech is transcribed and structured into fields in real time." },
  { title: "Auto-extracted fields", desc: "Medicines, doses, and frequency are pulled out, ready to confirm." },
  { title: "Hands-free workflow", desc: "Keep your focus on the patient, not the keyboard." },
]

export const AI_STATS: AiStat[] = [
  { num: "80%", label: "Less writing time" },
  { num: "3x", label: "Faster prescription" },
  { num: "99%", label: "Accuracy rate" },
]

export const SMART_DIAGNOSIS = ["Upper Respiratory Infection", "Mild Fever", "Pharyngitis"]

export const SMART_MEDS: AiMed[] = [
  { name: "Amoxicillin 500mg", dose: "1-0-1 · 5 days" },
  { name: "Paracetamol 650mg", dose: "1-1-1 · SOS" },
  { name: "Cetirizine 10mg", dose: "0-0-1 · 3 days" },
  { name: "Vitamin C 500mg", dose: "1-0-0 · 7 days" },
]
