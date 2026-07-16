"use client"

import type { ComponentPropsWithoutRef } from "react"
import { useBookDemoStore } from "../../stores/book-demo.store"

// Opens the single mounted <BookDemoDialog/>. Lets server-component sections
// (Hero, Cta) keep a plain styled trigger without becoming client components.
export function BookDemoTrigger(props: ComponentPropsWithoutRef<"button">) {
  const open = useBookDemoStore((s) => s.open)
  return <button type="button" onClick={open} {...props} />
}
