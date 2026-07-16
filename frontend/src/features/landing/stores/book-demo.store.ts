import { create } from "zustand"

// Shared open/close state for the Book Demo dialog so any CTA (hero, closing band)
// opens the single mounted <BookDemoDialog/>.
type BookDemoState = {
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

export const useBookDemoStore = create<BookDemoState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setOpen: (isOpen) => set({ isOpen }),
}))
