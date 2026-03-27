import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Active language pair
      nativeLang: 'fr',
      targetLang: 'en',
      level: 'beginner',
      setNativeLang: (code) => set({ nativeLang: code }),
      setTargetLang: (code) => set({ targetLang: code }),
      setLevel: (level) => set({ level }),

      // Session XP (reset each session, persisted to DB on lesson end)
      sessionXP: 0,
      addSessionXP: (pts) => set((s) => ({ sessionXP: s.sessionXP + pts })),
      resetSessionXP: () => set({ sessionXP: 0 }),
    }),
    { name: 'polyglot-store' }
  )
)

export default useAppStore
