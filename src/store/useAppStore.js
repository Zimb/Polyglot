import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Generate a stable device UUID for anonymous Supabase access
function generateDeviceId() {
  return crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const useAppStore = create(
  persist(
    (set, get) => ({
      // ─── Anonymous device ID (used before auth is set up) ───────────────────
      deviceId: generateDeviceId(),

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

      // Session XP
      sessionXP: 0,
      addSessionXP: (pts) => set((s) => ({ sessionXP: s.sessionXP + pts })),
      resetSessionXP: () => set({ sessionXP: 0 }),

      // Saved flashcards — local cache, synced to Supabase
      savedCards: [],
      addCards: (newCards) => set((s) => {
        const existing = new Set(s.savedCards.map((c) => `${c.word}|${c.targetLang}|${c.level}`))
        const toAdd = newCards.filter((c) => !existing.has(`${c.word}|${c.targetLang}|${c.level}`))
        return { savedCards: [...s.savedCards, ...toAdd] }
      }),
      setSavedCards: (cards) => set({ savedCards: cards }),
      clearSavedCards: () => set({ savedCards: [] }),

      // Alphabet cards — persisted per lang+script key (e.g. 'ja_hiragana')
      alphabetCards: {},
      setAlphabetCards: (key, cards) => set((s) => ({ alphabetCards: { ...s.alphabetCards, [key]: cards } })),
      addAlphabetCards: (key, cards) => set((s) => ({
        alphabetCards: { ...s.alphabetCards, [key]: [...(s.alphabetCards[key] ?? []), ...cards] },
      })),

      // Card generation mode:
      //   'discovery' — AI generates new cards (future: paid feature)
      //   'standard'  — browse existing global card pool (free)
      discoveryMode: true,
      setDiscoveryMode: (v) => set({ discoveryMode: Boolean(v) }),
    }),
    {
      name: 'polyglot-store',
      // Keep deviceId stable across store resets
      partialize: (state) => ({
        deviceId:      state.deviceId,
        nativeLang:    state.nativeLang,
        targetLang:    state.targetLang,
        level:         state.level,
        savedCards:    state.savedCards,
        alphabetCards: state.alphabetCards,
        discoveryMode: state.discoveryMode,
      }),
    }
  )
)

export default useAppStore
