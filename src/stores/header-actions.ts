import type { ReactNode } from "react"

import { create } from "zustand"

type HeaderActionsStore = {
  desktopRight: ReactNode | null
  mobileRight: ReactNode | null
  setHeaderActions: (next: { desktopRight?: ReactNode | null; mobileRight?: ReactNode | null }) => void
  clearHeaderActions: () => void
}

export const useHeaderActionsStore = create<HeaderActionsStore>((set) => ({
  desktopRight: null,
  mobileRight: null,
  setHeaderActions: (next) =>
    set((prev) => ({
      desktopRight: Object.prototype.hasOwnProperty.call(next, "desktopRight") ? next.desktopRight ?? null : prev.desktopRight,
      mobileRight: Object.prototype.hasOwnProperty.call(next, "mobileRight") ? next.mobileRight ?? null : prev.mobileRight,
    })),
  clearHeaderActions: () => set({ desktopRight: null, mobileRight: null }),
}))
