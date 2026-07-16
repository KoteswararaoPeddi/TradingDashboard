import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

import { GlobalHosts } from "@shared/components/GlobalHosts";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// Playfair Display powers the italic display accents in the headings.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MediNex+ | Smarter Healthcare Connecting Doctors and Patients",
  description:
    "MediNex+ is a hospital management platform connecting doctors and patients. Manage appointments, staff, billing, and analytics in one secure platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full scroll-smooth scroll-pt-20 antialiased`}
    >
      <body className="min-h-full">
        {children}
        <GlobalHosts />
      </body>
    </html>
  );
}
