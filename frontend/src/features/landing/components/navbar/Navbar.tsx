"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

import { cn } from "@lib/utils"
import { NAV_LINKS } from "../../config/nav.config"
import { ctaGhost, ctaTrial } from "../../styles/cta-styles"
import { Logo } from "../common/Logo"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const close = () => setMenuOpen(false)

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled && "bg-surface/95 shadow-sm shadow-primary/5 backdrop-blur-xl"
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body-base font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className={ctaGhost}>
            Sign in
          </Link>
          <Link href="/signup" className={ctaTrial}>
            Free 14 days trial
          </Link>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg text-foreground lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile drawer — wrapper clips the off-canvas panel so it never widens the page */}
      <div
        className={cn(
          "fixed inset-0 z-40 overflow-x-hidden lg:hidden",
          menuOpen ? "" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
          aria-hidden
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 flex w-72 max-w-[80vw] flex-col gap-2 bg-surface p-6 pt-20 shadow-xl transition-transform",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-lg px-4 py-3 text-body-lg font-medium text-foreground transition-colors hover:bg-primary-subtle hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <div className="my-3 h-px bg-border" />
          <Link href="/login" className={cn(ctaGhost, "w-full")} onClick={close}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(ctaTrial, "w-full")} onClick={close}>
            Free 14 days trial
          </Link>
        </aside>
      </div>
    </header>
  )
}
