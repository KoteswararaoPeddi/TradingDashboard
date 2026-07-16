import type { Solution } from "../types/solutions.types"

export const SOLUTIONS: Solution[] = [
  {
    id: "hospital",
    variant: "purple",
    pill: "For hospital operations",
    title: "Hospital Management",
    features: [
      "Complete OPD & IPD workflows",
      "Ward & nursing management",
      "Administrative automation",
      "Staff & doctor scheduling",
      "Patient records & EMR",
    ],
    mock: {
      kind: "list",
      title: "OPD Dashboard",
      badges: [
        { label: "Today: 24", tone: "violet" },
        { label: "Beds: 12", tone: "green" },
      ],
      rows: [
        { avatar: "RK", avatarTone: "violet", name: "Rahul Kumar", sub: "General OPD", badge: { label: "In Progress", tone: "violet" } },
        { avatar: "PS", avatarTone: "green", name: "Priya Sharma", sub: "Cardiology", badge: { label: "Waiting", tone: "amber" } },
        { avatar: "AS", avatarTone: "amber", name: "Amit Singh", sub: "Orthopedics", badge: { label: "Confirmed", tone: "green" } },
      ],
    },
  },
  {
    id: "pharmacy",
    variant: "white",
    pill: "For pharmacy teams",
    title: "Pharmacy & Inventory",
    features: [
      "Counter sales & billing",
      "Real-time stock alerts",
      "Purchase order management",
      "Pharmacy billing integration",
      "Expiry & batch tracking",
    ],
    mock: {
      kind: "list",
      title: "Pharmacy Stock",
      badges: [{ label: "2 Low", tone: "red" }],
      rows: [
        { dot: "green", name: "Paracetamol 500mg", value: "245 units" },
        { dot: "red", name: "Amoxicillin 250mg", value: "12 units", valueTone: "red" },
        { dot: "green", name: "Metformin 500mg", value: "88 units" },
      ],
      note: { label: "Amoxicillin below minimum stock level", tone: "amber" },
    },
  },
  {
    id: "lab",
    variant: "purple",
    pill: "For lab teams",
    title: "Lab & Diagnostics",
    features: [
      "Sample collection & tracking",
      "Test report generation",
      "Pathology dashboards",
      "Smart result delivery",
      "Lab billing & invoicing",
    ],
    mock: {
      kind: "list",
      title: "Lab Reports",
      badges: [{ label: "8 Completed", tone: "green" }],
      rows: [
        { name: "CBC, Complete Blood Count", badge: { label: "Complete", tone: "green" } },
        { name: "Liver Function Test (LFT)", badge: { label: "Pending", tone: "amber" } },
        { name: "Chest X-Ray", badge: { label: "Ready", tone: "violet" } },
      ],
    },
  },
  {
    id: "finance",
    variant: "white",
    pill: "For finance teams",
    title: "Finance & Analytics",
    features: [
      "Real-time revenue analytics",
      "Billing queue management",
      "Insurance claims processing",
      "Financial reporting",
      "Expense & payroll tracking",
    ],
    mock: {
      kind: "chart",
      title: "Revenue Analytics",
      amount: "₹1.24L",
      delta: "+18%",
      bars: [45, 60, 42, 68, 50, 72, 55, 78, 62, 96, 70, 92],
      labels: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
      highlight: [9, 11],
    },
  },
]
