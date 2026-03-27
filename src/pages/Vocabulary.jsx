import React, { useState, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { LANGUAGES, FLASHCARD_THEMES, getLang } from '../lib/languages'
import { supabase } from '../lib/supabase'

// ─── FlashCard component ──────────────────────────────────────────────────────
function FlashCard({ card, index, total, onKnew, onDidntKnow }) {
  const [flipped, setFlipped] = useState(false)

  const flip = () => setFlipped((f) => !f)

  const handleKnew = () => {
    setFlipped(false)
    setTimeout(() => onKnew(card), 300)
  }

  const handleDidntKnow = () => {
    setFlipped(false)
    setTimeout(() => onDidntKnow(card), 300)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto animate-slide-up">
      {/* Progress indicator */}
      <p className="text-sm text-zinc-400">
        Card {index + 1} / {total}
      </p>

      {/* The card */}
      <div
        className="card-scene w-full h-64 cursor-pointer select-none"
        onClick={flip}
        role="button"
        aria-label="Flip card"
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Front — target language word */}
          <div className="card-face bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-4xl font-bold text-white text-center leading-tight">
              {card.word}
            </span>
            {card.phonetic && (
              <span className="mt-3 text-indigo-200 text-sm tracking-wider">
                [{card.phonetic}]
              </span>
            )}
            <span className="mt-6 text-indigo-300 text-xs">tap to reveal</span>
          </div>

          {/* Back — translation + example */}
          <div className="card-back card-face bg-gradient-to-br from-emerald-600 to-teal-700 flex flex-col items-center justify-center p-8 shadow-2xl">
            <span className="text-3xl font-bold text-white text-center">
              {card.translation}
            </span>
            <div className="mt-5 text-center">
              <p className="text-emerald-100 text-sm italic">"{card.example}"</p>
              <p className="text-emerald-200 text-xs mt-1">"{card.exampleTranslation}"</p>
            </div>
            <span className="mt-4 text-emerald-300 text-xs">tap to flip back</span>
          </div>
        </div>
      </div>

      {/* Action buttons — only show when flipped */}
      {flipped && (
        <div className="flex gap-4 w-full animate-slide-up">
          <button
            onClick={handleDidntKnow}
            className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-500/30 transition-colors"
          >
            ✗ Didn't know
          </button>
          <button
            onClick={handleKnew}
            className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            ✓ Knew it!
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-zinc-500 text-sm">Tap the card to see the translation</p>
      )}
    </div>
  )
}

// ─── ScoreScreen component ────────────────────────────────────────────────────
function ScoreScreen({ knew, missed, total, theme, onRestart, onNewTheme }) {
  const score = Math.round((knew / total) * 100)

  const emoji =
    score === 100 ? '🏆' : score >= 75 ? '🎉' : score >= 50 ? '👍' : '💪'

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto text-center animate-slide-up">
      <div className="text-6xl">{emoji}</div>
      <h2 className="text-3xl font-bold text-white">Session complete!</h2>
      <p className="text-zinc-400">Theme: <span className="text-indigo-400 capitalize">{theme}</span></p>

      <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-6 w-full flex justify-around">
        <div>
          <p className="text-3xl font-bold text-emerald-400">{knew}</p>
          <p className="text-xs text-zinc-400 mt-1">Knew</p>
        </div>
        <div className="w-px bg-zinc-700" />
        <div>
          <p className="text-3xl font-bold text-red-400">{missed}</p>
          <p className="text-xs text-zinc-400 mt-1">Missed</p>
        </div>
        <div className="w-px bg-zinc-700" />
        <div>
          <p className="text-3xl font-bold text-violet-400">{score}%</p>
          <p className="text-xs text-zinc-400 mt-1">Score</p>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
        >
          Retry same theme
        </button>
        <button
          onClick={onNewTheme}
          className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold transition-colors"
        >
          New theme
        </button>
      </div>
    </div>
  )
}

// ─── SetupScreen component ────────────────────────────────────────────────────
function SetupScreen({ nativeLang, targetLang, level, onStart }) {
  const [selectedTheme, setSelectedTheme] = useState(FLASHCARD_THEMES[0])
  const [customNative, setCustomNative] = useState(nativeLang)
  const [customTarget, setCustomTarget] = useState(targetLang)
  const [customLevel, setCustomLevel] = useState(level)

  const nativeLangObj = getLang(customNative)
  const targetLangObj = getLang(customTarget)

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto animate-slide-up">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">Vocabulary Flashcards</h1>
        <p className="text-zinc-400 mt-2">
          {nativeLangObj?.flag} {nativeLangObj?.nativeName} → {targetLangObj?.flag}{' '}
          {targetLangObj?.nativeName}
        </p>
      </div>

      {/* Language selectors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 font-medium">Native language</label>
          <select
            value={customNative}
            onChange={(e) => setCustomNative(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.nativeName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-400 font-medium">Learning</label>
          <select
            value={customTarget}
            onChange={(e) => setCustomTarget(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            {LANGUAGES.filter((l) => l.code !== customNative).map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-zinc-400 font-medium">Level</label>
        <div className="flex gap-2">
          {['beginner', 'intermediate', 'advanced'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setCustomLevel(lvl)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors border ${
                customLevel === lvl
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Theme picker */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400 font-medium">Theme</label>
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {FLASHCARD_THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`py-2 px-3 rounded-xl text-sm capitalize text-left transition-colors border ${
                selectedTheme === theme
                  ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() =>
          onStart({ native: customNative, target: customTarget, level: customLevel, theme: selectedTheme })
        }
        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-colors shadow-lg shadow-indigo-900/40"
      >
        Start session →
      </button>
    </div>
  )
}

// ─── Main Vocabulary page ─────────────────────────────────────────────────────
export default function Vocabulary() {
  const { nativeLang, targetLang, level, user, addSessionXP } = useAppStore()

  const [phase, setPhase] = useState('setup') // setup | loading | playing | score
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [knew, setKnew] = useState([])
  const [missed, setMissed] = useState([])
  const [error, setError] = useState(null)
  const [sessionConfig, setSessionConfig] = useState(null)

  const startSession = useCallback(async ({ native, target, level: lvl, theme }) => {
    setError(null)
    setPhase('loading')
    setSessionConfig({ native, target, level: lvl, theme })

    try {
      const res = await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLang: target, nativeLang: native, level: lvl, theme }),
      })

      // Safe JSON parse — avoids crash when body is empty or HTML (e.g. 404 from dev server)
      const safeJson = async (r) => {
        const text = await r.text()
        if (!text) return {}
        try { return JSON.parse(text) } catch { return { error: `Server returned: ${r.status} ${r.statusText}` } }
      }

      if (!res.ok) {
        const body = await safeJson(res)
        throw new Error(body.error || `Server error ${res.status}`)
      }

      const body = await safeJson(res)
      const fetched = body.cards

      if (!Array.isArray(fetched) || fetched.length === 0) {
        throw new Error('No cards returned. Check your API key or try again.')
      }

      setCards(fetched)
      setCurrentIndex(0)
      setKnew([])
      setMissed([])
      setPhase('playing')
    } catch (err) {
      setError(err.message)
      setPhase('setup')
    }
  }, [])

  const handleKnew = useCallback(
    async (card) => {
      const newKnew = [...knew, card]
      setKnew(newKnew)
      addSessionXP(10)

      // Save word to Supabase if user is logged in
      if (user?.id && sessionConfig) {
        await supabase.from('learned_words').upsert(
          {
            user_id: user.id,
            target_lang: sessionConfig.target,
            word: card.word,
            translation: card.translation,
            mastery: 1,
          },
          { onConflict: 'user_id,target_lang,word', ignoreDuplicates: false }
        )
      }

      advanceOrFinish(newKnew, missed)
    },
    [knew, missed, addSessionXP, user, sessionConfig]
  )

  const handleDidntKnow = useCallback(
    (card) => {
      const newMissed = [...missed, card]
      setMissed(newMissed)
      advanceOrFinish(knew, newMissed)
    },
    [knew, missed]
  )

  const advanceOrFinish = (k, m) => {
    const next = k.length + m.length
    if (next >= cards.length) {
      setPhase('score')
    } else {
      setCurrentIndex(next)
    }
  }

  const restart = () => {
    if (sessionConfig) {
      startSession(sessionConfig)
    }
  }

  const newTheme = () => {
    setPhase('setup')
    setCards([])
    setKnew([])
    setMissed([])
  }

  return (
    <div className="min-h-screen bg-[#0f0f13] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🗂️</span>
          <span className="font-bold text-white text-lg">Flashcards</span>
        </div>
        {phase === 'playing' && (
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="w-32 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${((knew.length + missed.length) / cards.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">
              {knew.length + missed.length}/{cards.length}
            </span>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        {phase === 'setup' && (
          <>
            {error && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-900/80 border border-red-600 text-red-200 text-sm px-5 py-3 rounded-xl shadow-lg">
                ⚠️ {error}
              </div>
            )}
            <SetupScreen
              nativeLang={nativeLang}
              targetLang={targetLang}
              level={level}
              onStart={startSession}
            />
          </>
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4 text-zinc-400 animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <p>Generating flashcards…</p>
          </div>
        )}

        {phase === 'playing' && cards[currentIndex] && (
          <FlashCard
            card={cards[currentIndex]}
            index={currentIndex}
            total={cards.length}
            onKnew={handleKnew}
            onDidntKnow={handleDidntKnow}
          />
        )}

        {phase === 'score' && (
          <ScoreScreen
            knew={knew.length}
            missed={missed.length}
            total={cards.length}
            theme={sessionConfig?.theme}
            onRestart={restart}
            onNewTheme={newTheme}
          />
        )}
      </main>
    </div>
  )
}
