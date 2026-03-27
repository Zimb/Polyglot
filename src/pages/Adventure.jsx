import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useLocations from '../lib/useLocations'
import { supabase } from '../lib/supabase'
import { syncCardsToSupabase } from '../lib/cards'
import { syncDialogueToSupabase } from '../lib/dialogues'

// ─── Constants ────────────────────────────────────────────────────────────────
const PAIR_COLORS = ['#C8920A', '#90C8A0', '#E09898', '#8AABE0', '#C8A0D8']
const ITEM_H = 56
const GAP = 8
const ROW_H = ITEM_H + GAP
const SVG_W = 44

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── FlashCard (reused from Vocabulary, simplified for 5 cards) ───────────────
function FlashCard({ card, index, total, level, onKnew, onDidntKnow }) {
  const [flipped, setFlipped] = useState(false)
  const cardLabel = level === 'advanced' ? 'dialogue' : level === 'intermediate' ? 'expression' : 'vocabulaire'

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto animate-slide-up">
      <div className="card-scene w-full h-72 cursor-pointer select-none" onClick={() => setFlipped(f => !f)}
        role="button" aria-label="Retourner la carte">
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>
          {/* Recto */}
          <div className="card-face flex flex-col justify-between p-6"
            style={{ background: '#F5EDD8', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display uppercase tracking-widest"
                style={{ color: '#B0A090', letterSpacing: '0.12em' }}>{cardLabel}</span>
              <span className="text-xs font-display" style={{ color: '#B0A090' }}>{index + 1} / {total}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <span className="font-mono text-center leading-none break-words w-full"
                style={{ color: '#1A1410', fontSize: level === 'beginner' ? '38px' : '24px', fontWeight: 700 }}>
                {card.word}
              </span>
              {card.phonetic && (
                <span className="font-sans text-sm mt-3" style={{ color: '#8A7A68' }}>{card.phonetic}</span>
              )}
            </div>
            <p className="text-center text-xs font-display" style={{ color: '#B0A090' }}>appuyez pour révéler</p>
          </div>
          {/* Verso */}
          <div className="card-back card-face flex flex-col justify-between p-6"
            style={{ background: '#C8920A', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display uppercase tracking-widest"
                style={{ color: 'rgba(26,20,16,0.55)', letterSpacing: '0.12em' }}>traduction</span>
              <span className="text-xs font-display" style={{ color: 'rgba(26,20,16,0.55)' }}>{index + 1} / {total}</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="font-display text-center leading-tight"
                style={{ color: '#1A1410', fontSize: '28px', fontWeight: 700 }}>{card.translation}</span>
              {card.example && (
                <p className="text-center text-xs font-mono mt-3 px-3 leading-relaxed"
                  style={{ color: 'rgba(26,20,16,0.7)' }}>"{card.example}"</p>
              )}
              {card.exampleTranslation && (
                <p className="text-center text-xs font-sans italic" style={{ color: 'rgba(26,20,16,0.5)' }}>
                  {card.exampleTranslation}
                </p>
              )}
            </div>
            <div />
          </div>
        </div>
      </div>
      <p className="text-xs font-display text-center" style={{ color: '#4A3F35' }}>
        {flipped ? 'verso' : 'touchez pour révéler'}
      </p>
      <div className="flex gap-3 w-full">
        <button onClick={() => { setFlipped(false); setTimeout(() => onDidntKnow(card), 280) }}
          className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px]"
          style={{ background: '#1E1A15', border: '1px solid #2E2820', color: '#F0E6D3' }}>
          ← À revoir
        </button>
        <button onClick={() => { setFlipped(false); setTimeout(() => onKnew(card), 280) }}
          className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px]"
          style={{ background: '#C8920A', color: '#1A1410' }}>
          Je connais →
        </button>
      </div>
    </div>
  )
}

// ─── Slot (reused from FillBlank) ─────────────────────────────────────────────
function Slot({ slotId, word, result, isDropTarget, onClick, onDragOver, onDragLeave, onDrop }) {
  let bg = 'transparent'
  let borderColor = isDropTarget ? '#C8920A' : '#3A3028'
  let borderStyle = word ? 'solid' : 'dashed'
  let color = '#D4C0A0'
  if (result === 'correct') { bg = 'rgba(90,200,90,0.15)'; borderColor = '#5ABB6A'; color = '#7ADB8A'; borderStyle = 'solid' }
  if (result === 'wrong')   { bg = 'rgba(200,90,90,0.15)'; borderColor = '#D07070'; color = '#E09090'; borderStyle = 'solid' }

  return (
    <span
      onDragOver={(e) => { e.preventDefault(); onDragOver?.() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); const w = e.dataTransfer.getData('text/plain'); if (w) onDrop(w) }}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '76px', height: '26px', padding: '0 8px', margin: '0 3px',
        background: bg, border: `1.5px ${borderStyle} ${borderColor}`, borderRadius: '6px',
        color, fontFamily: "'DM Mono', monospace", fontSize: '13px',
        cursor: word ? 'pointer' : 'default', transition: 'border-color 0.15s, background 0.15s',
        verticalAlign: 'middle', position: 'relative', bottom: '1px', userSelect: 'none',
      }}
    >
      {word || ''}
    </span>
  )
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────
function SetupScreen({ nativeLang, targetLang, level, onStart }) {
  const locations = useLocations()
  const [selectedLocation, setSelectedLocation] = useState(locations[0])
  const [customLevel, setCustomLevel] = useState(level)

  const nativeLangObj = getLang(nativeLang)
  const targetLangObj = getLang(targetLang)

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full animate-slide-up">
      <div>
        <p className="text-xs font-display uppercase tracking-widest mb-2"
          style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>polyglot</p>
        <h1 className="font-display font-bold text-3xl" style={{ color: '#F0E6D3' }}>
          🗺️ Aventure
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8A7A68' }}>
          {nativeLangObj?.flag} {nativeLangObj?.nativeName}
          <span style={{ color: '#4A3F35', margin: '0 8px' }}>→</span>
          {targetLangObj?.flag} {targetLangObj?.nativeName}
        </p>
        <p className="mt-3 text-xs font-sans leading-relaxed" style={{ color: '#4A3F35' }}>
          Découvrez 5 mots, reliez-les à leur traduction, puis complétez un dialogue avec.
        </p>
      </div>

      {/* Niveau */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>Niveau</label>
        <div className="flex gap-2">
          {[
            { key: 'beginner', label: 'Débutant' },
            { key: 'intermediate', label: 'Intermédiaire' },
            { key: 'advanced', label: 'Avancé' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setCustomLevel(key)}
              className="flex-1 py-2 font-display text-xs font-medium transition-colors rounded-[8px]"
              style={{
                background: customLevel === key ? '#C8920A' : '#1E1A15',
                border: customLevel === key ? '1px solid #C8920A' : '1px solid #2E2820',
                color: customLevel === key ? '#1A1410' : '#8A7A68',
              }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Lieu */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>Où allez-vous ?</label>
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2E2820 transparent' }}>
          {locations.map((loc) => (
            <button key={loc.id} onClick={() => setSelectedLocation(loc)}
              className="relative py-3 px-3 text-left transition-colors rounded-[8px]"
              style={{
                background: selectedLocation.id === loc.id ? 'rgba(200,146,10,0.10)' : '#1E1A15',
                border: selectedLocation.id === loc.id ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
              }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '18px', lineHeight: 1 }}>{loc.emoji}</span>
                <span className="text-sm font-display"
                  style={{ color: selectedLocation.id === loc.id ? '#E8A820' : '#F0E6D3' }}>{loc.name}</span>
              </div>
              <p className="mt-1 text-xs leading-snug font-sans"
                style={{ color: selectedLocation.id === loc.id ? 'rgba(232,168,32,0.65)' : '#4A3F35' }}>{loc.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => onStart({ native: nativeLang, target: targetLang, level: customLevel, location: selectedLocation })}
        className="w-full py-4 font-display font-semibold text-base rounded-[8px]"
        style={{ background: '#C8920A', color: '#1A1410' }}>
        Commencer l'aventure {selectedLocation.emoji} →
      </button>
    </div>
  )
}

// ─── StepIndicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = [
    { key: 'flash', label: 'Flashcards', icon: '🃏' },
    { key: 'links', label: 'Relier', icon: '🔗' },
    { key: 'fill',  label: 'Dialogue', icon: '✏️' },
  ]
  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div style={{ width: '24px', height: '2px', background: done ? '#C8920A' : '#2E2820', borderRadius: '1px' }} />
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
              style={{
                background: active ? 'rgba(200,146,10,0.10)' : 'transparent',
                border: active ? '1px solid rgba(200,146,10,0.3)' : '1px solid transparent',
              }}>
              <span style={{ fontSize: '14px', opacity: done ? 0.4 : 1 }}>{s.icon}</span>
              <span className="text-xs font-display"
                style={{ color: active ? '#C8920A' : done ? '#4A3F35' : '#2E2820' }}>{s.label}</span>
              {done && <span style={{ color: '#C8920A', fontSize: '10px' }}>✓</span>}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main Adventure Component ─────────────────────────────────────────────────
export default function Adventure() {
  const { nativeLang, targetLang, level, addCards, deviceId, savedCards, addSavedDialogue } = useAppStore()

  // Global adventure state
  const [phase, setPhase] = useState('setup')
  // setup | flash-loading | flash-playing | flash-done | links-playing | links-done | fill-loading | fill-playing | fill-done | complete
  const [config, setConfig] = useState(null)
  const [adventureCards, setAdventureCards] = useState([]) // The 5 cards for this adventure
  const [error, setError] = useState(null)

  // ── Flash state ─────────────────────────────────────────────────────────────
  const [flashIndex, setFlashIndex] = useState(0)
  const [flashKnew, setFlashKnew] = useState([])
  const [flashMissed, setFlashMissed] = useState([])

  // ── Links state ─────────────────────────────────────────────────────────────
  const [linksGame, setLinksGame] = useState(null)

  // ── FillBlank state ─────────────────────────────────────────────────────────
  const [dialogueData, setDialogueData] = useState(null)
  const [slots, setSlots] = useState({})
  const [bank, setBank] = useState([])
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [revealed, setRevealed] = useState(new Set())

  const totalBlanks = useMemo(() => {
    if (!dialogueData) return 0
    return dialogueData.lines.reduce((sum, l) => sum + (l.blankWords?.length ?? 0), 0)
  }, [dialogueData])

  const filledCount = useMemo(() => Object.values(slots).filter(Boolean).length, [slots])
  const allFilled = totalBlanks > 0 && filledCount === totalBlanks

  // ── Step index for indicator ────────────────────────────────────────────────
  const stepIndex = phase.startsWith('flash') ? 0
    : phase.startsWith('links') ? 1
    : phase.startsWith('fill') || phase === 'complete' ? 2 : -1

  // ── Start the adventure ─────────────────────────────────────────────────────
  const startAdventure = useCallback(async (cfg) => {
    setConfig(cfg)
    setError(null)
    setPhase('flash-loading')

    // Words already known by the user for this lang+level
    const knownSet = new Set(
      savedCards
        .filter(c => c.targetLang === cfg.target && c.level === cfg.level)
        .map(c => c.word.toLowerCase().trim())
    )

    const isNew = (card) => !knownSet.has((card.word ?? '').toLowerCase().trim())

    const fetchCards = async (seenWords, count) => {
      const res = await fetch('/api/flashcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLang: cfg.target,
          nativeLang: cfg.native,
          level: cfg.level,
          location: cfg.location.name,
          seenWords,
          newCount: count,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `Erreur serveur ${res.status}`)
      if (!Array.isArray(body.cards) || body.cards.length === 0) throw new Error('Aucune carte reçue')
      return body.cards
    }

    try {
      const seenWords = [...knownSet]

      // First pass: request 8 to get a buffer
      const firstBatch = await fetchCards(seenWords, 8)
      let newCards = firstBatch.filter(isNew)

      // If fewer than 4 new cards, retry with all returned words as excluded
      if (newCards.length < 4) {
        const expanded = [...seenWords, ...firstBatch.map(c => c.word)]
        const secondBatch = await fetchCards(expanded, 8)
        const moreNew = secondBatch.filter(isNew)
        // Merge, dedup by word
        const seen = new Set(newCards.map(c => c.word.toLowerCase().trim()))
        for (const c of moreNew) {
          if (!seen.has(c.word.toLowerCase().trim())) {
            newCards.push(c)
            seen.add(c.word.toLowerCase().trim())
          }
        }
      }

      // Take up to 5, but at minimum keep whatever we have (even if < 4 after retries)
      const cards = newCards.slice(0, 5)
      if (cards.length === 0) throw new Error('Impossible de générer des mots nouveaux')

      setAdventureCards(cards)
      setFlashIndex(0)
      setFlashKnew([])
      setFlashMissed([])
      setPhase('flash-playing')
    } catch (err) {
      setError(err.message)
      setPhase('setup')
    }
  }, [savedCards])

  // ── Flash handlers ──────────────────────────────────────────────────────────
  const handleFlashKnew = useCallback((card) => {
    const k = [...flashKnew, card]
    setFlashKnew(k)
    if (k.length + flashMissed.length >= adventureCards.length) {
      // Save cards
      const enriched = adventureCards.map(c => ({
        ...c, level: config.level, location: config.location,
        targetLang: config.target, savedAt: new Date().toISOString(),
      }))
      addCards(enriched)
      syncCardsToSupabase(enriched, deviceId)
      setPhase('flash-done')
    } else {
      setFlashIndex(k.length + flashMissed.length)
    }
  }, [flashKnew, flashMissed, adventureCards, config, addCards, deviceId])

  const handleFlashDidntKnow = useCallback((card) => {
    const m = [...flashMissed, card]
    setFlashMissed(m)
    if (flashKnew.length + m.length >= adventureCards.length) {
      const enriched = adventureCards.map(c => ({
        ...c, level: config.level, location: config.location,
        targetLang: config.target, savedAt: new Date().toISOString(),
      }))
      addCards(enriched)
      syncCardsToSupabase(enriched, deviceId)
      setPhase('flash-done')
    } else {
      setFlashIndex(flashKnew.length + m.length)
    }
  }, [flashKnew, flashMissed, adventureCards, config, addCards, deviceId])

  // ── Transition to Links ─────────────────────────────────────────────────────
  const startLinks = useCallback(() => {
    const n = adventureCards.length
    setLinksGame({
      pairs: adventureCards,
      leftOrder: shuffle([...Array(n).keys()]),
      rightOrder: shuffle([...Array(n).keys()]),
      matches: [],
      selectedLeft: null,
      wrongFlash: null,
    })
    setPhase('links-playing')
  }, [adventureCards])

  // ── Links handlers ──────────────────────────────────────────────────────────
  const handleLeftClick = (pairIdx) => {
    if (!linksGame || linksGame.wrongFlash) return
    const matchedSet = new Set(linksGame.matches.map(m => m.pairIdx))
    if (matchedSet.has(pairIdx)) return
    setLinksGame(g => ({ ...g, selectedLeft: g.selectedLeft === pairIdx ? null : pairIdx }))
  }

  const handleRightClick = (pairIdx) => {
    if (!linksGame || linksGame.wrongFlash || linksGame.selectedLeft === null) return
    const matchedSet = new Set(linksGame.matches.map(m => m.pairIdx))
    if (matchedSet.has(pairIdx)) return

    if (linksGame.selectedLeft === pairIdx) {
      setLinksGame(g => ({
        ...g,
        matches: [...g.matches, { pairIdx, colorIdx: g.matches.length }],
        selectedLeft: null,
      }))
    } else {
      const fl = { left: linksGame.selectedLeft, right: pairIdx }
      setLinksGame(g => ({ ...g, wrongFlash: fl }))
      setTimeout(() => setLinksGame(g => ({ ...g, wrongFlash: null, selectedLeft: null })), 600)
    }
  }

  // Check if links complete
  useEffect(() => {
    if (linksGame && linksGame.matches.length === adventureCards.length && adventureCards.length > 0) {
      setTimeout(() => setPhase('links-done'), 600)
    }
  }, [linksGame?.matches.length, adventureCards.length])

  // ── Transition to FillBlank ─────────────────────────────────────────────────
  const startFillBlank = useCallback(async () => {
    setPhase('fill-loading')
    setError(null)

    const words = adventureCards.map(c => c.word)

    try {
      const res = await fetch('/api/adventure-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLang: config.target,
          nativeLang: config.native,
          level: config.level,
          location: config.location.name,
          words,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Erreur ${res.status}`)
      }
      const data = await res.json()

      const initSlots = {}
      data.lines.forEach((line, li) => {
        ;(line.blankWords ?? []).forEach((_, bi) => { initSlots[`${li}-${bi}`] = null })
      })
      setDialogueData(data)
      setSlots(initSlots)
      setBank([...data.wordBank])
      setSelected(null)
      setResults(null)
      setRevealed(new Set())
      setDragOver(null)
      setPhase('fill-playing')
    } catch (err) {
      setError(err.message)
      setPhase('links-done') // go back to transition screen
    }
  }, [adventureCards, config])

  // ── FillBlank handlers ──────────────────────────────────────────────────────
  const placeWord = useCallback((slotId, word) => {
    if (slots[slotId]) return
    setSlots(prev => ({ ...prev, [slotId]: word }))
    setBank(prev => { const i = prev.indexOf(word); if (i === -1) return prev; const n = [...prev]; n.splice(i, 1); return n })
    setSelected(null)
    setResults(null)
  }, [slots])

  const returnWord = useCallback((slotId) => {
    const word = slots[slotId]
    if (!word) return
    setSlots(prev => ({ ...prev, [slotId]: null }))
    setBank(prev => [...prev, word])
    setResults(null)
  }, [slots])

  const handleSlotClick = useCallback((slotId) => {
    if (slots[slotId]) returnWord(slotId)
    else if (selected) placeWord(slotId, selected)
  }, [slots, selected, placeWord, returnWord])

  const handleValidate = useCallback(() => {
    if (!dialogueData) return
    // Reveal all line translations
    setRevealed(new Set(dialogueData.lines.map((_, i) => i)))
    // Save dialogue
    const dialogue = {
      targetLang: config.target, nativeLang: config.native,
      level: config.level, location: config.location,
      lines: dialogueData.lines, wordBank: dialogueData.wordBank,
    }
    addSavedDialogue(dialogue)
    syncDialogueToSupabase(dialogue, deviceId)
    // Proceed to complete after letting user read translations
    setTimeout(() => setPhase('complete'), 1400)
  }, [dialogueData, addSavedDialogue, config, deviceId])

  const toggleReveal = useCallback((idx) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1E1A15' }}>
        <Link to="/hub" style={{ textDecoration: 'none' }}>
          <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
            poly<span style={{ color: '#C8920A' }}>g</span>lot
          </span>
        </Link>
        {config && (
          <span className="text-xs font-display" style={{ color: '#4A3F35' }}>
            {config.location.emoji} {config.location.name}
          </span>
        )}
      </header>

      {/* Step indicator */}
      {stepIndex >= 0 && <StepIndicator current={stepIndex} />}

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-2 px-4 py-3 rounded-[8px] text-sm font-sans"
          style={{ background: '#301A1A', border: '1px solid #603030', color: '#E08080' }}>
          ⚠ {error}
        </div>
      )}

      <main className="flex-1 flex items-center justify-center px-6 py-8">

        {/* ── Setup ──────────────────────────────────────────────────── */}
        {phase === 'setup' && (
          <SetupScreen nativeLang={nativeLang} targetLang={targetLang} level={level} onStart={startAdventure} />
        )}

        {/* ── Flash loading ──────────────────────────────────────────── */}
        {phase === 'flash-loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
            <p className="font-display text-sm" style={{ color: '#4A3F35' }}>
              {config?.location.emoji} Préparation de l'aventure…
            </p>
          </div>
        )}

        {/* ── Flash playing ──────────────────────────────────────────── */}
        {phase === 'flash-playing' && adventureCards[flashIndex] && (
          <FlashCard
            card={adventureCards[flashIndex]}
            index={flashIndex}
            total={adventureCards.length}
            level={config?.level}
            onKnew={handleFlashKnew}
            onDidntKnow={handleFlashDidntKnow}
          />
        )}

        {/* ── Flash done → transition to Links ───────────────────────── */}
        {phase === 'flash-done' && (
          <div className="flex flex-col items-center gap-5 animate-slide-up text-center max-w-xs">
            <p style={{ fontSize: '48px', lineHeight: 1 }}>🃏 ✓</p>
            <p className="font-display font-bold text-xl" style={{ color: '#F0E6D3' }}>
              5 mots découverts !
            </p>
            <p className="text-sm font-sans" style={{ color: '#4A3F35' }}>
              Maintenant, reliez chaque mot à sa traduction.
            </p>
            <button onClick={startLinks}
              className="w-full py-4 font-display font-semibold text-base rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410' }}>
              Relier les mots 🔗 →
            </button>
          </div>
        )}

        {/* ── Links playing ──────────────────────────────────────────── */}
        {phase === 'links-playing' && linksGame && (
          <div className="w-full" style={{ maxWidth: '400px' }}>
            <p className="text-xs font-display text-center mb-5" style={{ color: '#4A3F35' }}>
              {linksGame.selectedLeft !== null ? 'Choisissez la traduction →' : '← Sélectionnez un mot'}
            </p>
            <div className="flex items-start">
              {/* Left */}
              <div className="flex flex-col flex-1" style={{ gap: `${GAP}px` }}>
                {linksGame.leftOrder.map((pairIdx) => {
                  const card = linksGame.pairs[pairIdx]
                  const matchedSet = new Set(linksGame.matches.map(m => m.pairIdx))
                  const mi = linksGame.matches.find(m => m.pairIdx === pairIdx)
                  const matchColor = mi ? PAIR_COLORS[mi.colorIdx % PAIR_COLORS.length] : null
                  const isSelected = linksGame.selectedLeft === pairIdx
                  const isWrong = linksGame.wrongFlash?.left === pairIdx

                  let bg = '#1A1410', border = '#2E2820', textColor = '#F0E6D3'
                  if (matchColor) { bg = `${matchColor}18`; border = matchColor; textColor = matchColor }
                  else if (isWrong) { bg = 'rgba(224,128,128,0.12)'; border = '#E09898' }
                  else if (isSelected) { bg = 'rgba(200,146,10,0.14)'; border = '#C8920A' }

                  return (
                    <button key={pairIdx} onClick={() => handleLeftClick(pairIdx)}
                      style={{
                        height: `${ITEM_H}px`, background: bg, border: `1px solid ${border}`,
                        borderRadius: '8px', color: textColor, fontFamily: "'DM Mono', monospace",
                        fontSize: '14px', fontWeight: 600, padding: '0 12px', textAlign: 'left',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        cursor: matchColor ? 'default' : 'pointer', transition: 'border-color 0.15s, background 0.15s',
                      }}>{card.word}</button>
                  )
                })}
              </div>

              {/* SVG */}
              <svg width={SVG_W} height={linksGame.pairs.length * ROW_H} style={{ flexShrink: 0, overflow: 'visible' }}>
                {linksGame.matches.map((m, i) => {
                  const lv = linksGame.leftOrder.indexOf(m.pairIdx)
                  const rv = linksGame.rightOrder.indexOf(m.pairIdx)
                  const y1 = lv * ROW_H + ITEM_H / 2
                  const y2 = rv * ROW_H + ITEM_H / 2
                  const half = SVG_W / 2
                  return (
                    <path key={i}
                      d={`M 0 ${y1} C ${half} ${y1}, ${half} ${y2}, ${SVG_W} ${y2}`}
                      stroke={PAIR_COLORS[m.colorIdx % PAIR_COLORS.length]}
                      strokeWidth="2" fill="none" strokeLinecap="round" />
                  )
                })}
              </svg>

              {/* Right */}
              <div className="flex flex-col flex-1" style={{ gap: `${GAP}px` }}>
                {linksGame.rightOrder.map((pairIdx) => {
                  const card = linksGame.pairs[pairIdx]
                  const mi = linksGame.matches.find(m => m.pairIdx === pairIdx)
                  const matchColor = mi ? PAIR_COLORS[mi.colorIdx % PAIR_COLORS.length] : null
                  const isWrong = linksGame.wrongFlash?.right === pairIdx
                  const isClickable = linksGame.selectedLeft !== null && !matchColor && !linksGame.wrongFlash

                  let bg = '#1A1410', border = '#2E2820', textColor = '#8A7A68'
                  if (matchColor) { bg = `${matchColor}18`; border = matchColor; textColor = matchColor }
                  else if (isWrong) { bg = 'rgba(224,128,128,0.12)'; border = '#E09898' }
                  else if (isClickable) { border = '#3E3228' }

                  return (
                    <button key={pairIdx} onClick={() => handleRightClick(pairIdx)}
                      style={{
                        height: `${ITEM_H}px`, background: bg, border: `1px solid ${border}`,
                        borderRadius: '8px', color: textColor, fontFamily: "'DM Sans', system-ui, sans-serif",
                        fontSize: '13px', padding: '0 12px', textAlign: 'right',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        cursor: matchColor ? 'default' : 'pointer', transition: 'border-color 0.15s, background 0.15s',
                      }}>{card.translation}</button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Links done → transition to FillBlank ───────────────────── */}
        {phase === 'links-done' && (
          <div className="flex flex-col items-center gap-5 animate-slide-up text-center max-w-xs">
            <p style={{ fontSize: '48px', lineHeight: 1 }}>🔗 ✓</p>
            <p className="font-display font-bold text-xl" style={{ color: '#F0E6D3' }}>
              Tout relié !
            </p>
            <p className="text-sm font-sans" style={{ color: '#4A3F35' }}>
              Dernière étape : complétez un dialogue avec ces mots.
            </p>
            <button onClick={startFillBlank}
              className="w-full py-4 font-display font-semibold text-base rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410' }}>
              Compléter le dialogue ✏️ →
            </button>
          </div>
        )}

        {/* ── Fill loading ───────────────────────────────────────────── */}
        {phase === 'fill-loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
            <p className="font-display text-sm" style={{ color: '#4A3F35' }}>Génération du dialogue…</p>
          </div>
        )}

        {/* ── Fill playing ───────────────────────────────────────────── */}
        {phase === 'fill-playing' && dialogueData && (
          <div className="flex flex-col gap-5 w-full" style={{ maxWidth: '540px' }}>

            {/* Dialogue */}
            <div className="rounded-[14px] px-5 pt-5 pb-4 flex flex-col"
              style={{ background: '#0F0D0A', border: '1px solid #1C1914' }}>
              {dialogueData.lines.map((line, li) => {
                const isB = line.speaker === 'B'
                const parts = (line.text ?? '').split('___')
                return (
                  <div key={li} style={{ paddingTop: li === 0 ? 0 : '18px', paddingLeft: isB ? '12px' : 0 }}>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-xs flex-shrink-0 select-none"
                        style={{ color: isB ? '#40705A' : '#7A6040', userSelect: 'none', minWidth: '14px', lineHeight: '26px' }}>
                        {line.speaker}
                      </span>
                      <span className="font-mono text-sm" style={{ color: '#C8B898', lineHeight: '2' }}>
                        {parts.map((part, pi) => (
                          <React.Fragment key={pi}>
                            {part}
                            {pi < parts.length - 1 && (
                              <Slot slotId={`${li}-${pi}`} word={slots[`${li}-${pi}`] ?? null}
                                result={results?.[`${li}-${pi}`]} isDropTarget={dragOver === `${li}-${pi}`}
                                onDrop={(w) => placeWord(`${li}-${pi}`, w)} onClick={() => handleSlotClick(`${li}-${pi}`)}
                                onDragOver={() => setDragOver(`${li}-${pi}`)} onDragLeave={() => setDragOver(null)} />
                            )}
                          </React.Fragment>
                        ))}
                      </span>
                      <button onClick={() => toggleReveal(li)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                          padding: '0 4px', color: revealed.has(li) ? '#C8920A' : '#2A2418',
                          fontSize: '13px', lineHeight: 1, transition: 'color 0.15s', marginLeft: '4px',
                        }}>◉</button>
                    </div>
                    {revealed.has(li) && (
                      <p className="font-sans text-xs italic"
                        style={{ color: '#4A4038', lineHeight: 1.5, paddingLeft: '18px', paddingTop: '2px' }}>
                        {line.translation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-xs" style={{ color: '#2E2820' }}>{filledCount} / {totalBlanks} mots placés</span>
              {selected && (
                <span className="font-mono text-xs px-2 py-1 rounded-[5px]"
                  style={{ background: 'rgba(200,146,10,0.12)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.25)' }}>
                  {selected}
                </span>
              )}
            </div>

            {/* Word bank */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-display uppercase tracking-widest"
                style={{ color: '#2E2820', letterSpacing: '0.14em' }}>Mots à placer</p>
              <div className="flex flex-wrap gap-2">
                {bank.map((word, i) => (
                  <div key={`${word}-${i}`} draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', word); setSelected(word) }}
                    onDragEnd={() => setDragOver(null)}
                    onClick={() => setSelected(s => s === word ? null : word)}
                    className="px-3 py-1.5 rounded-[7px] font-mono text-sm select-none"
                    style={{
                      background: selected === word ? 'rgba(200,146,10,0.14)' : '#1A1410',
                      border: selected === word ? '1px solid rgba(200,146,10,0.45)' : '1px solid #2A2018',
                      color: selected === word ? '#C8920A' : '#C8B898',
                      cursor: 'grab', transition: 'border-color 0.12s, background 0.12s',
                    }}>{word}</div>
                ))}
                {bank.length === 0 && (
                  <span className="font-mono text-xs" style={{ color: '#2A2018' }}>— tous les mots sont placés —</span>
                )}
              </div>
            </div>

            {/* Validate button */}
            <button onClick={handleValidate}
              className="w-full py-4 font-display font-semibold text-base rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410' }}>
              Valider →
            </button>
          </div>
        )}

        {/* ── Complete ───────────────────────────────────────────────── */}
        {phase === 'complete' && (
          <div className="flex flex-col items-center gap-6 animate-slide-up text-center max-w-sm">
            <p className="font-display font-bold" style={{ fontSize: '64px', lineHeight: 1, color: '#C8920A' }}>✓</p>
            <div>
              <p className="font-display font-bold text-xl" style={{ color: '#F0E6D3' }}>Aventure complète !</p>
              <p className="text-sm font-sans mt-1" style={{ color: '#4A3F35' }}>
                {config?.location.emoji} {config?.location.name} — {adventureCards.length} mots maîtrisés
              </p>
            </div>

            {/* Recap */}
            <div className="w-full flex flex-col gap-2">
              {adventureCards.map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                  style={{ background: '#1A1410', border: '1px solid #2E282033' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PAIR_COLORS[i % PAIR_COLORS.length] }} />
                  <span className="font-mono text-sm flex-1 text-left" style={{ color: '#F0E6D3' }}>{c.word}</span>
                  <span style={{ color: '#2E2820', fontSize: '12px' }}>→</span>
                  <span className="font-sans text-sm flex-1 text-right" style={{ color: '#8A7A68' }}>{c.translation}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => startAdventure(config)}
                className="w-full py-3 font-display font-semibold text-sm rounded-[8px]"
                style={{ background: '#C8920A', color: '#1A1410' }}>
                Nouvelle aventure {config?.location.emoji} →
              </button>
              <button onClick={() => { setPhase('setup'); setAdventureCards([]); setError(null) }}
                className="w-full py-3 font-display font-semibold text-sm rounded-[8px]"
                style={{ background: '#1E1A15', border: '1px solid #2E2820', color: '#F0E6D3' }}>
                Changer de lieu
              </button>
              <Link to="/hub"
                className="w-full py-3 font-display text-sm text-center"
                style={{ color: '#4A3F35', textDecoration: 'underline' }}>
                ← Retour au menu
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
