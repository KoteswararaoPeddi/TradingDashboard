import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { GlobalHosts } from "@shared/components/GlobalHosts";
import { DEFAULT_ACCENT } from "@shared/constants/accent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // The cockpit's numerics run heavy (balances and stat values sit at 800-900).
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Trade Journal | Personal Trading Analytics Dashboard",
  description:
    "Trade Journal is your personal trading-journal analytics dashboard. Log trades, track performance, and review your edge in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // `dark` is static, not a toggle: the app is dark-only, and this class is what
    // activates the shadcn primitives' built-in `dark:` utilities. See globals.css.
    <html
      lang="en"
      className={`dark ${inter.variable} h-full scroll-smooth scroll-pt-20 antialiased`}
    >
      {/* The accent is server-rendered with the default so the first paint is already
          correct; the switcher rewrites it on the client from the stored preference. */}
      <body className="min-h-full" data-accent={DEFAULT_ACCENT} suppressHydrationWarning>
        {children}
        <GlobalHosts />
      </body>
    </html>
  );
}
