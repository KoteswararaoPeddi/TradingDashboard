import type { Testimonial } from "../types/testimonials.types"

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "priya",
    rating: 5,
    quote:
      "MediNex+ transformed how we manage patient flow. The appointment system and billing module saved us hours every day. Our staff productivity increased by 40%.",
    initials: "PS",
    name: "Dr. Priya Sharma",
    role: "Cardiologist, Apollo Hospitals",
  },
  {
    id: "rajesh",
    rating: 4,
    quote:
      "The multi-tenant architecture means all our branches run on one platform. Real-time analytics and the department management system are outstanding.",
    initials: "RN",
    name: "Rajesh Nair",
    role: "Hospital Administrator, Fortis Healthcare",
  },
  {
    id: "amina",
    rating: 5,
    quote:
      "As a small clinic, the Starter plan gave us enterprise-level features at an affordable price. The OPD dashboard is intuitive and our patients love the experience.",
    initials: "AP",
    name: "Dr. Amina Patel",
    role: "General Physician, City Clinic",
  },
  // {
  //   id: "sanjay",
  //   quote:
  //     "Managing 12 hospitals from a single Super Admin panel is a game-changer. Data isolation, role-based access, and consolidated reports, exactly what we needed.",
  //   initials: "SM",
  //   name: "Sanjay Mehta",
  //   role: "CEO, MedGroup Chain",
  // },
]
