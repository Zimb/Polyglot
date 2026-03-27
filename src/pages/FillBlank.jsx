import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useLocations from '../lib/useLocations'
import { syncDialogueToSupabase, fetchDialoguesFromSupabase } from '../lib/dialogues'

// ─── Slot ─────────────────────────────────────────────────────────────────────
function Slot({ slotId, word, result, isDropTarget, onClick, onDragOver, onDragLeave, onDrop }) {
  let bg          = 'transparent'
  let borderColor = isDropTarget ? '#C8920A' : '#3A3028'
  let borderStyle = word ? 'solid' : 'dashed'
  let color       = '#D4C0A0'

  if (result === 'correct') { bg = 'rgba(90,200,90,0.15)'; borderColor = '#5ABB6A'; color = '#7ADB8A'; borderStyle = 'solid' }
  if (result === 'wrong')   { bg = 'rgba(200,90,90,0.15)'; borderColor = '#D07070'; color = '#E09090'; borderStyle = 'solid' }

  return (
    <span
      onDragOver={(e) => { e.preventDefault(); onDragOver?.() }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); const w = e.dataTransfer.getData('text/plain'); if (w) onDrop(w) }}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '76px',
        height: '26px',
        padding: '0 8px',
        margin: '0 3px',
        background: bg,
        border: `1.5px ${borderStyle} ${borderColor}`,
        borderRadius: '6px',
        color,
        fontFamily: "'DM Mono', monospace",
        fontSize: '13px',
        cursor: word ? 'pointer' : 'default',
        transition: 'border-color 0.15s, background 0.15s',
        verticalAlign: 'middle',
        position: 'relative',
        bottom: '1px',
        userSelect: 'none',
      }}
    >
      {word || ''}
    </span>
  )
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────
function SetupScreen({ nativeLang, targetLang, level, savedDialogues, discoveryMode, setDiscoveryMode, onStart, error }) {
  const locations = useLocations()
  const [selectedLoc, setSelectedLoc] = useState(locations[0])
  const [customLevel, setCustomLevel] = useState(level ?? 'beginner')
  const nativeObj = getLang(nativeLang)
  const targetObj = getLang(targetLang)

  // Per-location dialogue count at the currently selected level — used for location badges & locking
  const locUnlockedForLevel = useMemo(() => {
    const map = {}
    ;(savedDialogues ?? []).forEach(d => {
      if (d.targetLang !== targetLang || d.level !== customLevel) return
      const key = d.location?.id
      if (!key) return
      map[key] = (map[key] ?? 0) + 1
    })
    return map
  }, [savedDialogues, targetLang, customLevel])

  const libLocDisabled = !discoveryMode && (locUnlockedForLevel[selectedLoc.id] ?? 0) === 0

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full animate-slide-up pt-2">
      <div>
        <h1 className="font-display font-bold text-3xl" style={{ color: '#F0E6D3' }}>✏️ Dialogue</h1>
        <p className="mt-1 text-sm" style={{ color: '#8A7A68' }}>
          {nativeObj?.flag} {nativeObj?.nativeName}
          <span style={{ color: '#4A3F35', margin: '0 8px' }}>→</span>
          {targetObj?.flag} {targetObj?.nativeName}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-[8px]" style={{ background: 'rgba(200,80,80,0.1)', border: '1px solid #3A2020' }}>
          <p className="text-xs font-sans" style={{ color: '#D09090' }}>Erreur : {error}</p>
        </div>
      )}

      {/* Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider" style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Mode
        </label>
        <div className="flex gap-2">
          {[
            { key: true,  label: '✨ Découverte', desc: "L'IA génère un nouveau dialogue" },
            { key: false, label: '📚 Bibliothèque', desc: 'Rejouer un dialogue débloqué' },
          ].map(({ key, label, desc }) => {
            const isLib = key === false
            const levelCount = Object.values(locUnlockedForLevel).reduce((s, n) => s + n, 0)
            const active = discoveryMode === key
            return (
              <button key={String(key)}
                onClick={() => setDiscoveryMode(key)}
                className="flex-1 py-3 px-3 text-left transition-colors rounded-[8px] relative"
                style={{
                  background: active ? 'rgba(200,146,10,0.10)' : '#1E1A15',
                  border: active ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                  cursor: 'pointer',
                }}>
                {isLib && levelCount > 0 && (
                  <span className="absolute top-2 right-2 font-mono text-xs font-bold px-1.5 py-0.5 rounded-[4px] leading-none"
                    style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)' }}>
                    {levelCount}
                  </span>
                )}
                <p className="font-display text-sm font-medium"
                  style={{ color: active ? '#E8A820' : '#8A7A68' }}>
                  {label}
                </p>
                <p className="text-xs font-sans mt-0.5"
                  style={{ color: active ? 'rgba(232,168,32,0.65)' : '#4A3F35' }}>
                  {desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Level */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider" style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Niveau
        </label>
        <div className="flex gap-2">
          {[
            { key: 'beginner',     label: 'Débutant' },
            { key: 'intermediate', label: 'Intermédiaire' },
            { key: 'advanced',     label: 'Avancé' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setCustomLevel(key)}
              className="flex-1 py-2 font-display text-xs font-medium transition-colors rounded-[8px]"
              style={{
                background: customLevel === key ? '#C8920A' : '#1E1A15',
                border:     customLevel === key ? '1px solid #C8920A' : '1px solid #2E2820',
                color:      customLevel === key ? '#1A1410' : '#8A7A68',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider" style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Lieu du dialogue
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2E2820 transparent' }}>
          {locations.map((loc) => {
            const unlockedHere = locUnlockedForLevel[loc.id] ?? 0
            const selected = selectedLoc.id === loc.id
            const locLibEmpty = !discoveryMode && unlockedHere === 0
            return (
              <button key={loc.id} onClick={() => { if (!locLibEmpty) setSelectedLoc(loc) }}
                className="py-3 px-3 text-left transition-colors rounded-[8px] relative"
                disabled={locLibEmpty}
                style={{
                  background: locLibEmpty ? '#111009' : selected ? 'rgba(200,146,10,0.10)' : '#1E1A15',
                  border:     locLibEmpty ? '1px solid #181510' : selected ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                  opacity:    locLibEmpty ? 0.35 : 1,
                  cursor:     locLibEmpty ? 'not-allowed' : 'pointer',
                }}>
                {!discoveryMode && unlockedHere > 0 && (
                  <span className="absolute top-1.5 right-1.5 font-mono text-xs font-bold px-1 py-0 rounded-[3px] leading-none"
                    style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)', fontSize: '10px' }}>
                    {unlockedHere}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{loc.emoji}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-display"
                      style={{ color: selected ? '#E8A820' : '#F0E6D3' }}>
                      {loc.name}
                    </span>
                    {loc.desc && (
                      <span className="text-xs leading-tight mt-0.5"
                        style={{ color: selected ? 'rgba(232,168,32,0.7)' : 'rgba(240,230,211,0.4)' }}>
                        {loc.desc}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onStart({ level: customLevel, location: selectedLoc, isDiscovery: discoveryMode })}
        disabled={libLocDisabled}
        className="w-full py-4 font-display font-semibold text-base rounded-[8px]"
        style={{
          background: libLocDisabled ? '#1E1A15' : '#C8920A',
          color: libLocDisabled ? '#3A3028' : '#1A1410',
          cursor: libLocDisabled ? 'not-allowed' : 'pointer',
          border: libLocDisabled ? '1px solid #2A2018' : 'none',
        }}>
        {discoveryMode ? `Générer ${selectedLoc.emoji} →` : `Rejouer ${selectedLoc.emoji} →`}
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FillBlank() {
  const { nativeLang, targetLang, level, savedDialogues, addSavedDialogue, mergeSavedDialogues, deviceId, discoveryMode, setDiscoveryMode } = useAppStore()

  // Fetch dialogues from Supabase on mount and merge with local store
  useEffect(() => {
    fetchDialoguesFromSupabase(deviceId).then((remote) => {
      if (remote.length > 0) mergeSavedDialogues(remote)
    })
  }, [deviceId])

  const [phase,    setPhase]    = useState('setup')   // 'setup' | 'loading' | 'playing' | 'complete'
  const [config,   setConfig]   = useState(null)
  const [gameData, setGameData] = useState(null)       // { lines, wordBank }
  const [slots,    setSlots]    = useState({})         // { slotId: string | null }
  const [bank,     setBank]     = useState([])         // string[]
  const [revealed, setRevealed] = useState(new Set())  // Set<number>
  const [selected, setSelected] = useState(null)       // string | null (word selected from bank)
  const [results,  setResults]  = useState(null)       // { [slotId]: 'correct'|'wrong' } | null
  const [dragOver, setDragOver] = useState(null)       // slotId string | null
  const [error,    setError]    = useState(null)

  const totalBlanks = useMemo(() => {
    if (!gameData) return 0
    return gameData.lines.reduce((sum, line) => sum + (line.blankWords?.length ?? 0), 0)
  }, [gameData])

  const filledCount = useMemo(
    () => Object.values(slots).filter(Boolean).length,
    [slots],
  )
  const allFilled = totalBlanks > 0 && filledCount === totalBlanks

  // ── API call ────────────────────────────────────────────────────────────────
  const startSession = async (cfg) => {
    setConfig(cfg)
    setError(null)

    // Library mode: pick a random saved dialogue for this location+level
    if (!cfg.isDiscovery) {
      const candidates = (savedDialogues ?? []).filter(
        d => d.targetLang === targetLang && d.level === cfg.level && d.location?.id === cfg.location.id
      )
      if (candidates.length === 0) {
        setError('Aucun dialogue débloqué pour ce lieu. Essayez le mode Découverte.')
        return
      }
      const picked = candidates[Math.floor(Math.random() * candidates.length)]
      const initSlots = {}
      picked.lines.forEach((line, li) => {
        ;(line.blankWords ?? []).forEach((_, bi) => { initSlots[`${li}-${bi}`] = null })
      })
      setGameData(picked)
      setSlots(initSlots)
      setBank([...picked.wordBank])
      setRevealed(new Set())
      setSelected(null)
      setResults(null)
      setPhase('playing')
      return
    }

    setPhase('loading')
    try {
      const res = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLang,
          nativeLang,
          level: cfg.level,
          location: cfg.location.name,
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Erreur ${res.status}`)
      }
      const data = await res.json()

      // Initialize slots object
      const initSlots = {}
      data.lines.forEach((line, li) => {
        ;(line.blankWords ?? []).forEach((_, bi) => { initSlots[`${li}-${bi}`] = null })
      })

      setGameData(data)
      setSlots(initSlots)
      setBank([...data.wordBank])
      setRevealed(new Set())
      setSelected(null)
      setResults(null)
      setPhase('playing')
    } catch (err) {
      setError(err.message)
      setPhase('setup')
    }
  }

  // ── Place a word from bank into a slot ──────────────────────────────────────
  const placeWord = useCallback((slotId, word) => {
    const oldWord = slots[slotId]
    setSlots(prev => ({ ...prev, [slotId]: word }))
    setBank(prev => {
      let removed = false
      const next = prev.filter(w => {
        if (!removed && w === word) { removed = true; return false }
        return true
      })
      if (oldWord) next.push(oldWord)
      return next
    })
    setResults(null)
    setSelected(null)
  }, [slots])

  // ── Return a word from slot back to bank ────────────────────────────────────
  const returnWord = useCallback((slotId) => {
    const word = slots[slotId]
    if (!word) return
    setSlots(prev => ({ ...prev, [slotId]: null }))
    setBank(prev => [...prev, word])
    setResults(null)
  }, [slots])

  // ── Slot click: place selected word or return filled word ───────────────────
  const handleSlotClick = useCallback((slotId) => {
    if (slots[slotId]) {
      returnWord(slotId)
    } else if (selected) {
      placeWord(slotId, selected)
    }
  }, [slots, selected, placeWord, returnWord])

  // ── Bank tap: toggle selection ──────────────────────────────────────────────
  const handleBankClick = useCallback((word) => {
    setSelected(s => s === word ? null : word)
  }, [])

  // ── Check all answers ───────────────────────────────────────────────────────
  const checkAnswers = useCallback(() => {
    if (!gameData) return
    const res = {}
    let allCorrect = true
    gameData.lines.forEach((line, li) => {
      ;(line.blankWords ?? []).forEach((correct, bi) => {
        const slotId = `${li}-${bi}`
        const placed = slots[slotId]
        const ok = placed?.toLowerCase() === correct?.toLowerCase()
        res[slotId] = ok ? 'correct' : 'wrong'
        if (!ok) allCorrect = false
      })
    })
    setResults(res)
    if (allCorrect) {
      // Save completed dialogue to Library if it was a Discovery session
      if (config?.isDiscovery && gameData) {
        const dialogue = {
          targetLang,
          nativeLang,
          level: config.level,
          location: config.location,
          lines: gameData.lines,
          wordBank: gameData.wordBank,
        }
        addSavedDialogue(dialogue)
        syncDialogueToSupabase(dialogue, deviceId)
      }
      setTimeout(() => setPhase('complete'), 900)
    } else {
      // Return wrong words to bank after flash
      setTimeout(() => {
        Object.entries(res).forEach(([slotId, verdict]) => {
          if (verdict === 'wrong') returnWord(slotId)
        })
        setResults(null)
      }, 800)
    }
  }, [gameData, slots, returnWord])

  const toggleReveal = useCallback((idx) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }, [])

  // ── Sub-pages ────────────────────────────────────────────────────────────────
  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <PageHeader />
        <main className="flex-1 px-6 py-6">
          {phase === 'loading' ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
              <p className="font-display text-sm" style={{ color: '#4A3F35' }}>Génération du dialogue…</p>
            </div>
          ) : (
            <SetupScreen
              nativeLang={nativeLang}
              targetLang={targetLang}
              level={level}
              savedDialogues={savedDialogues}
              discoveryMode={discoveryMode}
              setDiscoveryMode={setDiscoveryMode}
              onStart={startSession}
              error={error}
            />
          )}
        </main>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <PageHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 animate-slide-up">
          <div className="text-center">
            <p className="font-display font-bold" style={{ fontSize: '64px', lineHeight: 1, color: '#C8920A' }}>✓</p>
            <p className="font-display font-bold text-xl mt-3" style={{ color: '#F0E6D3' }}>Dialogue complété !</p>
            <p className="text-sm font-sans mt-1" style={{ color: '#4A3F35' }}>
              {config?.location.emoji} {config?.location.name}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={() => startSession(config)}
              className="w-full py-3 font-display font-semibold text-sm rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410' }}>
              Nouveau dialogue →
            </button>
            <button onClick={() => setPhase('setup')}
              className="w-full py-3 font-display font-semibold text-sm rounded-[8px]"
              style={{ background: '#1E1A15', border: '1px solid #2E2820', color: '#F0E6D3' }}>
              Changer de lieu
            </button>
            <Link to="/hub"
              className="w-full py-3 font-display text-sm rounded-[8px] text-center"
              style={{ color: '#4A3F35', textDecoration: 'underline', display: 'block' }}>
              ← Retour au menu
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ─── Playing phase ────────────────────────────────────────────────────────
  const SPEAKER = {
    A: { label: '#7A6040' },
    B: { label: '#40705A' },
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <PageHeader subtitle={config?.location.emoji + ' ' + config?.location.name} />

      <main className="flex-1 flex flex-col px-4 pb-10 gap-5"
        style={{ maxWidth: '540px', margin: '0 auto', width: '100%', paddingTop: '20px' }}>

        {/* ── Dialogue block ─────────────────────────────────────────────── */}
        <div className="rounded-[14px] px-5 pt-5 pb-4 flex flex-col"
          style={{ background: '#0F0D0A', border: '1px solid #1C1914' }}>

          {gameData.lines.map((line, li) => {
            const spk = SPEAKER[line.speaker] ?? SPEAKER.A
            const parts = (line.text ?? '').split('___')
            const isB = line.speaker === 'B'

            return (
              <div key={li} style={{ paddingTop: li === 0 ? 0 : '18px', paddingLeft: isB ? '12px' : 0 }}>
                {/* Line row */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  {/* Speaker */}
                  <span className="font-mono text-xs flex-shrink-0 select-none"
                    style={{ color: spk.label, userSelect: 'none', minWidth: '14px', lineHeight: '26px' }}>
                    {line.speaker}
                  </span>

                  {/* Text with inline slots */}
                  <span className="font-mono text-sm" style={{ color: '#C8B898', lineHeight: '2' }}>
                    {parts.map((part, pi) => (
                      <React.Fragment key={pi}>
                        {part}
                        {pi < parts.length - 1 && (
                          <Slot
                            slotId={`${li}-${pi}`}
                            word={slots[`${li}-${pi}`] ?? null}
                            result={results?.[`${li}-${pi}`]}
                            isDropTarget={dragOver === `${li}-${pi}`}
                            onDrop={(w) => placeWord(`${li}-${pi}`, w)}
                            onClick={() => handleSlotClick(`${li}-${pi}`)}
                            onDragOver={() => setDragOver(`${li}-${pi}`)}
                            onDragLeave={() => setDragOver(null)}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </span>

                  {/* Translate toggle */}
                  <button
                    onClick={() => toggleReveal(li)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: '0 4px',
                      color: revealed.has(li) ? '#C8920A' : '#2A2418',
                      fontSize: '13px',
                      lineHeight: 1,
                      transition: 'color 0.15s',
                      marginLeft: '4px',
                    }}>
                    ◉
                  </button>
                </div>

                {/* Translation (revealed) */}
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

        {/* ── Progress hint ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-xs" style={{ color: '#2E2820' }}>
            {filledCount} / {totalBlanks} mots placés
          </span>
          {selected && (
            <span className="font-mono text-xs px-2 py-1 rounded-[5px]"
              style={{ background: 'rgba(200,146,10,0.12)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.25)' }}>
              {selected}
            </span>
          )}
        </div>

        {/* ── Word bank ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#2E2820', letterSpacing: '0.14em' }}>
            Mots à placer
          </p>
          <div className="flex flex-wrap gap-2">
            {bank.map((word, i) => (
              <div
                key={`${word}-${i}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', word)
                  setSelected(word)
                }}
                onDragEnd={() => setDragOver(null)}
                onClick={() => handleBankClick(word)}
                className="px-3 py-1.5 rounded-[7px] font-mono text-sm select-none"
                style={{
                  background:  selected === word ? 'rgba(200,146,10,0.14)' : '#1A1410',
                  border:      selected === word ? '1px solid rgba(200,146,10,0.45)' : '1px solid #2A2018',
                  color:       selected === word ? '#C8920A' : '#C8B898',
                  cursor:      'grab',
                  transition:  'border-color 0.12s, background 0.12s',
                }}>
                {word}
              </div>
            ))}
            {bank.length === 0 && (
              <span className="font-mono text-xs" style={{ color: '#2A2018' }}>
                — tous les mots sont placés —
              </span>
            )}
          </div>
        </div>

        {/* ── Vérifier button ────────────────────────────────────────────── */}
        {allFilled && (
          <button
            onClick={checkAnswers}
            className="w-full py-4 font-display font-semibold text-base rounded-[8px] animate-slide-up"
            style={{ background: '#C8920A', color: '#1A1410' }}>
            Vérifier →
          </button>
        )}
      </main>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function PageHeader({ subtitle }) {
  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #1A1714' }}>
      <Link to="/hub" style={{ textDecoration: 'none' }}>
        <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
          poly<span style={{ color: '#C8920A' }}>g</span>lot
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {subtitle && (
          <span className="font-sans text-xs" style={{ color: '#4A3F35' }}>{subtitle}</span>
        )}
        <span className="text-xs font-display uppercase tracking-widest" style={{ color: '#2E2820' }}>
          ✏️
        </span>
      </div>
    </header>
  )
}
