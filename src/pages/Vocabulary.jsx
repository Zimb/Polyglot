import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useLocations from '../lib/useLocations'
import { supabase } from '../lib/supabase'
import { syncCardsToSupabase } from '../lib/cards'
import { speak } from '../lib/tts'

// ─── FlashCard ────────────────────────────────────────────────────────────────
function FlashCard({ card, index, total, level, targetLang, onKnew, onDidntKnow }) {
  const [flipped, setFlipped] = useState(false)
  const cardLabel = level === 'advanced' ? 'dialogue' : level === 'intermediate' ? 'expression' : 'vocabulaire'

  const flip = () => setFlipped((f) => !f)

  const handleKnew = () => {
    setFlipped(false)
    setTimeout(() => onKnew(card), 280)
  }
  const handleDidntKnow = () => {
    setFlipped(false)
    setTimeout(() => onDidntKnow(card), 280)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto animate-slide-up">

      {/* Card */}
      <div
        className="card-scene w-full h-72 cursor-pointer select-none"
        onClick={flip}
        role="button"
        aria-label="Retourner la carte"
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>

          {/* Recto — fond papier crème */}
          <div className="card-face flex flex-col justify-between p-6"
            style={{ background: '#F5EDD8', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            {/* Numéro */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-display uppercase tracking-widest"
                  style={{ color: '#B0A090', letterSpacing: '0.12em' }}>
                  {cardLabel}
                </span>
                {card.isReview && (
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(176,160,144,0.15)', color: '#B0A090', fontSize: '10px', letterSpacing: '0.06em' }}>
                    révision
                  </span>
                )}
              </div>
              <span className="text-xs font-display" style={{ color: '#B0A090' }}>
                {index + 1} / {total}
              </span>
            </div>

            {/* Mot — héros */}
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <span className="font-mono text-center leading-none break-words w-full"
                style={{
                  color: '#1A1410',
                  fontSize: card.word.length > 12 ? '42px' : card.word.length > 8 ? '56px' : '68px',
                  fontWeight: 700,
                }}>
                {card.word}
              </span>
              {card.phonetic && (
                <span className="mt-3 font-mono text-sm" style={{ color: '#7A6A58' }}>
                  [{card.phonetic}]
                </span>
              )}
            </div>

            {/* TTS button */}
            <button
              onClick={(e) => { e.stopPropagation(); speak(card.word, targetLang) }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] font-display text-xs transition-colors"
              style={{
                background: 'rgba(176,160,144,0.15)',
                border: '1px solid rgba(176,160,144,0.3)',
                color: '#7A6A58',
                cursor: 'pointer',
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>
          </div>

          {/* Verso — fond ambre */}
          <div className="card-back card-face flex flex-col justify-between p-6"
            style={{ background: '#C8920A', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display uppercase tracking-widest"
                style={{ color: 'rgba(26,20,16,0.55)', letterSpacing: '0.12em' }}>
                traduction
              </span>
              <span className="text-xs font-display" style={{ color: 'rgba(26,20,16,0.55)' }}>
                {index + 1} / {total}
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <span className="font-display text-center leading-tight"
                style={{
                  color: '#1A1410',
                  fontSize: card.translation.length > 14 ? '32px' : '44px',
                  fontWeight: 700,
                }}>
                {card.translation}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(26,20,16,0.18)', paddingTop: '12px' }}>
              <p className="font-mono text-sm italic text-center leading-snug"
                style={{ color: 'rgba(26,20,16,0.75)' }}>
                "{card.example}"
              </p>
              <p className="font-mono text-xs text-center mt-1"
                style={{ color: 'rgba(26,20,16,0.5)' }}>
                "{card.exampleTranslation}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flèches de navigation */}
      <div className="flex items-center justify-between w-full" style={{ paddingTop: '4px' }}>
        <button
          onClick={handleDidntKnow}
          className="flex items-center justify-center transition-transform active:scale-90"
          style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#F5EDD8', color: '#1A1410', fontSize: '24px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Passer">
          ←
        </button>
        <p className="text-xs font-display text-center" style={{ color: '#4A3F35', letterSpacing: '0.04em' }}>
          {flipped ? 'passer  ·  suivant' : ''}
        </p>
        <button
          onClick={handleKnew}
          className="flex items-center justify-center transition-transform active:scale-90"
          style={{ width: '54px', height: '54px', borderRadius: '50%', background: '#C8920A', color: '#1A1410', fontSize: '24px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Suivant">
          →
        </button>
      </div>
    </div>
  )
}

// ─── CongratulationsCard ─────────────────────────────────────────────────────
const CONGRATS = {
  en: 'Congratulations!',
  fr: 'Félicitations !',
  es: '¡Felicitaciones!',
  de: 'Herzlichen Glückwunsch!',
  it: 'Congratulazioni!',
  pt: 'Parabéns!',
  ja: 'おめでとうございます！',
  zh: '恭喜！',
  ar: '!تهانيّ',
  ru: 'Поздравляем!',
  ko: '축하합니다!',
  nl: 'Gefeliciteerd!',
  pl: 'Gratulacje!',
  tr: 'Tebrikler!',
  hi: 'बधाई हो!',
}

function CongratulationsCard({ location, total, targetLang, nativeLang, onRestart, onContinue, onNewTheme }) {
  const [flipped, setFlipped] = useState(false)
  const nativeText = CONGRATS[nativeLang] ?? 'Félicitations !'
  const targetText = CONGRATS[targetLang] ?? CONGRATS['en']

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto animate-slide-up">

      {/* Card */}
      <div
        className="card-scene w-full h-72 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        role="button"
        aria-label="Retourner la carte"
      >
        <div className={`card-inner ${flipped ? 'flipped' : ''}`}>

          {/* Recto — fond papier crème, langue cible */}
          <div className="card-face flex flex-col justify-between p-6"
            style={{ background: '#F5EDD8', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display uppercase tracking-widest"
                style={{ color: '#B0A090', letterSpacing: '0.12em' }}>
                {location?.emoji} {location?.name}
              </span>
              <span className="text-xs font-display" style={{ color: '#B0A090' }}>
                {total} / {total}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-2">
              <span className="font-mono text-center leading-none break-words w-full"
                style={{ color: '#1A1410', fontSize: '40px', fontWeight: 700 }}>
                {targetText}
              </span>
            </div>
            <p className="text-center text-xs font-display" style={{ color: '#B0A090', letterSpacing: '0.05em' }}>
              appuyez pour révéler
            </p>
          </div>

          {/* Verso — fond ambre, langue native */}
          <div className="card-back card-face flex flex-col justify-between p-6"
            style={{ background: '#C8920A', boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs font-display uppercase tracking-widest"
                style={{ color: 'rgba(26,20,16,0.55)', letterSpacing: '0.12em' }}>
                traduction
              </span>
              <span className="text-xs font-display" style={{ color: 'rgba(26,20,16,0.55)' }}>
                {total} / {total}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <span className="font-display text-center leading-tight"
                style={{ color: '#1A1410', fontSize: '42px', fontWeight: 700 }}>
                {nativeText}
              </span>
              <span className="font-mono text-sm mt-1" style={{ color: 'rgba(26,20,16,0.6)' }}>
                {total} cartes complétées
              </span>
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="text-xs font-display text-center" style={{ color: '#4A3F35', letterSpacing: '0.04em' }}>
        {flipped ? 'session terminée' : 'touchez pour révéler'}
      </p>

      {/* Boutons */}
      <div className="flex gap-3 w-full">
        <button onClick={onRestart}
          className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px] transition-colors"
          style={{ background: '#1E1A15', border: '1px solid #2E2820', color: '#F0E6D3' }}>
          Reprendre
        </button>
        <button onClick={onContinue}
          className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px] transition-colors"
          style={{ background: '#C8920A', color: '#1A1410' }}>
          Continuer →
        </button>
      </div>

      {/* Autre lieu */}
      <button onClick={onNewTheme}
        className="text-xs font-display transition-colors"
        style={{ color: '#4A3F35', background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Changer de lieu
      </button>
    </div>
  )
}

// ─── Setup ────────────────────────────────────────────────────────────────────
function SetupScreen({ nativeLang, targetLang, level, savedCards, onStart, discoveryMode, setDiscoveryMode }) {
  const locations = useLocations()
  const [selectedLocation, setSelectedLocation] = useState(locations[0])
  const [customLevel, setCustomLevel] = useState(level)
  // Map of "location_name|level" → card count for current lang pair
  // One single DB query on mount / lang change instead of one per combo
  const [globalCounts, setGlobalCounts] = useState(null) // null = loading

  useEffect(() => {
    setGlobalCounts(null)
    supabase
      .from('global_cards')
      .select('location_id, level')
      .eq('target_lang', targetLang)
      .eq('native_lang', nativeLang)
      .then(({ data, error }) => {
        if (error || !data) { setGlobalCounts({}); return }
        const counts = {}
        data.forEach((row) => {
          const k = `${row.location_id}|${row.level}`
          counts[k] = (counts[k] ?? 0) + 1
        })
        setGlobalCounts(counts)
        // Force Discovery if truly nothing available for default selection
        const localCount = savedCards.filter(c =>
          c.targetLang === targetLang &&
          c.level === customLevel &&
          (c.location?.id === selectedLocation.id || c.location?.name === selectedLocation.name)
        ).length
        const defaultKey = `${selectedLocation.id}|${customLevel}`
        if (!counts[defaultKey] && localCount === 0) setDiscoveryMode(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetLang, nativeLang])

  // Derived count for the currently selected combo
  const globalCount = globalCounts === null
    ? null
    : (globalCounts[`${selectedLocation.id}|${customLevel}`] ?? 0)

  // Count saved cards per location+level for the currently selected target language
  const cardCounts = useMemo(() => {
    const map = {}
    savedCards
      .filter((c) => c.targetLang === targetLang)
      .forEach((c) => {
        const key = `${c.location?.id ?? 'unknown'}|${c.level}`
        map[key] = (map[key] ?? 0) + 1
      })
    return map
  }, [savedCards, targetLang])

  const nativeLangObj = getLang(nativeLang)
  const targetLangObj = getLang(targetLang)

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto w-full animate-slide-up">
      {/* En-tête */}
      <div>
        <p className="text-xs font-display uppercase tracking-widest mb-2"
          style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>
          polyglot
        </p>
        <h1 className="font-display font-bold text-3xl" style={{ color: '#F0E6D3' }}>
          Flashcards
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#8A7A68' }}>
          {nativeLangObj?.flag} {nativeLangObj?.nativeName}
          <span style={{ color: '#4A3F35', margin: '0 8px' }}>→</span>
          {targetLangObj?.flag} {targetLangObj?.nativeName}
        </p>
      </div>

      {/* Niveau */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Niveau
        </label>
        <div className="flex gap-2">
          {[
            { key: 'beginner', label: 'Débutant' },
            { key: 'intermediate', label: 'Intermédiaire' },
            { key: 'advanced', label: 'Avancé' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setCustomLevel(key)}
              className="flex-1 py-2 font-display text-xs font-medium capitalize transition-colors rounded-[8px]"
              style={{
                background: customLevel === key ? '#C8920A' : '#1E1A15',
                border: customLevel === key ? '1px solid #C8920A' : '1px solid #2E2820',
                color: customLevel === key ? '#1A1410' : '#8A7A68',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lieu */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Où allez-vous ?
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#2E2820 transparent' }}>
          {locations.map((loc) => {
            const count = cardCounts[`${loc.id}|${customLevel}`] ?? 0
            const locLocked = !discoveryMode && count === 0
            const selected = selectedLocation.id === loc.id
            return (
              <button key={loc.id}
                onClick={() => { if (!locLocked) setSelectedLocation(loc) }}
                disabled={locLocked}
                className="relative py-3 px-3 text-left transition-colors rounded-[8px]"
                style={{
                  background: locLocked ? '#111009' : selected ? 'rgba(200,146,10,0.10)' : '#1E1A15',
                  border: locLocked ? '1px solid #181510' : selected ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                  opacity: locLocked ? 0.35 : 1,
                  cursor: locLocked ? 'not-allowed' : 'pointer',
                }}>
                {count > 0 && (
                  <span className="absolute top-1.5 right-1.5 font-mono text-xs font-bold px-1 py-0 rounded-[3px] leading-none"
                    style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)', fontSize: '10px' }}>
                    {count}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{loc.emoji}</span>
                  <span className="text-sm font-display"
                    style={{ color: selected ? '#E8A820' : '#F0E6D3' }}>
                    {loc.name}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-snug font-sans"
                  style={{ color: selected ? 'rgba(232,168,32,0.65)' : '#4A3F35', paddingRight: count > 0 ? '20px' : '0' }}>
                  {loc.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mode de génération */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-display uppercase tracking-wider"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          Mode
        </label>
        <div className="flex gap-2">
          {[
            { key: true,  label: '✨ Découverte', desc: 'Cartes partagées ou nouvelles si inédit' },
            { key: false, label: '🌍 Bibliothèque', desc: 'Parcours les cartes de la communauté' },
          ].map(({ key, label, desc }) => {
            const isLibrary = key === false
            const localCount = savedCards.filter(c =>
              c.targetLang === targetLang &&
              c.level === customLevel &&
              (c.location?.id === selectedLocation.id || c.location?.name === selectedLocation.name)
            ).length
            const displayCount = globalCount > 0 ? globalCount : localCount
            // Disabled only when we know for sure there are no cards (both sources checked)
            // While loading (null), still allow if local cards exist
            const libDisabled = isLibrary && (
              (globalCount === null && localCount === 0) ||
              (globalCount !== null && globalCount === 0 && localCount === 0)
            )
            const active = discoveryMode === key && !libDisabled
            return (
              <button key={String(key)}
                onClick={() => { if (!libDisabled) setDiscoveryMode(key) }}
                className="flex-1 py-3 px-3 text-left transition-colors rounded-[8px] relative"
                disabled={libDisabled}
                style={{
                  background: libDisabled ? '#141210' : active ? 'rgba(200,146,10,0.10)' : '#1E1A15',
                  border: libDisabled ? '1px solid #1E1A15' : active ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                  cursor: libDisabled ? 'not-allowed' : 'pointer',
                  opacity: libDisabled ? 0.45 : 1,
                }}>
                {isLibrary && displayCount > 0 && (
                  <span className="absolute top-2 right-2 font-mono text-xs font-bold px-1.5 py-0.5 rounded-[4px] leading-none"
                    style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)' }}>
                    {displayCount}
                  </span>
                )}
                <p className="font-display text-sm font-medium"
                  style={{ color: libDisabled ? '#3A3028' : active ? '#E8A820' : '#8A7A68' }}>
                  {label}
                </p>
                <p className="text-xs font-sans mt-0.5"
                  style={{ color: libDisabled ? '#2A2018' : active ? 'rgba(232,168,32,0.65)' : '#4A3F35' }}>
                  {isLibrary && libDisabled ? 'Aucun mot disponible' : desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={() => onStart({ native: nativeLang, target: targetLang, level: customLevel, location: selectedLocation })}
        className="w-full py-4 font-display font-semibold text-base rounded-[8px] transition-colors"
        style={{ background: '#C8920A', color: '#1A1410' }}>
        Entrer {selectedLocation.emoji} {selectedLocation.name} →
      </button>

      {/* Lien vers les révisions personnelles */}
      <Link to="/mes-fiches"
        className="text-xs font-display text-center transition-colors"
        style={{ color: '#4A3F35', textDecoration: 'none' }}>
        📖 Réviser mes fiches enregistrées →
      </Link>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Vocabulary() {
  const { nativeLang, targetLang, level, user, addSessionXP, addCards, deviceId, savedCards,
    discoveryMode, setDiscoveryMode } = useAppStore()

  const [phase, setPhase] = useState('setup')
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [knew, setKnew] = useState([])
  const [missed, setMissed] = useState([])
  const [error, setError] = useState(null)
  const [sessionConfig, setSessionConfig] = useState(null)
  // Accumulate all words seen in this location across multiple sessions
  const [seenWords, setSeenWords] = useState([])

  const startSession = useCallback(async ({ native, target, level: lvl, location, seen = [] }) => {
    setError(null)
    setPhase('loading')
    setSessionConfig({ native, target, level: lvl, location })

    // Pick up to 2 random review cards (both modes benefit from review)
    const eligible = savedCards.filter(
      (c) => c.targetLang === target && c.level === lvl && !seen.includes(c.word)
    )
    const reviewCards = eligible
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(2, eligible.length))
      .map((c) => ({ ...c, isReview: true }))
    const newCount = 8 - reviewCards.length

    try {
      let fetched

      if (!discoveryMode) {
        // ── Standard mode: browse global card pool ───────────────────────
        const res = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLang: target,
            nativeLang: native,
            level: lvl,
            locationId: location.name,
            seenWords: seen,
            newCount,
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || `Erreur serveur ${res.status}`)

        if (!body.cards || body.cards.length === 0) {
          // Fall back to local saved cards for this location if global pool is empty
          const localFallback = savedCards
            .filter(c => c.targetLang === target && c.level === lvl)
            .map(c => ({
              word: c.word,
              phonetic: c.phonetic ?? null,
              translation: c.translation,
              example: c.example ?? null,
              exampleTranslation: c.exampleTranslation ?? null,
            }))
          if (localFallback.length === 0) {
            throw new Error(
              `Aucun mot disponible pour « ${location.name} » en mode Bibliothèque.\n✨ Essayez le mode Découverte pour être le premier à explorer ce lieu !`
            )
          }
          fetched = localFallback.sort(() => Math.random() - 0.5).slice(0, newCount)
        } else {
          fetched = body.cards
        }
      } else {
        // ── Discovery mode: generate new cards via AI ───────────────────
        const res = await fetch('/api/flashcard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLang: target,
            nativeLang: native,
            level: lvl,
            location: location.name,
            seenWords: seen,
            newCount,
          }),
        })
        const safeJson = async (r) => {
          const text = await r.text()
          if (!text) return {}
          try { return JSON.parse(text) } catch { return { error: `Erreur serveur ${r.status}` } }
        }
        if (!res.ok) {
          const body = await safeJson(res)
          throw new Error(body.error || `Erreur serveur ${res.status}`)
        }
        const body = await safeJson(res)
        fetched = body.cards
        if (!Array.isArray(fetched) || fetched.length === 0) {
          throw new Error('Aucune carte reçue. Vérifiez votre clé API.')
        }
      }

      // Merge review cards into the batch at random positions
      const merged = [...fetched]
      reviewCards.forEach((rc) => {
        const pos = Math.floor(Math.random() * (merged.length + 1))
        merged.splice(pos, 0, rc)
      })

      setCards(merged)
      setCurrentIndex(0)
      setKnew([])
      setMissed([])
      setPhase('playing')
    } catch (err) {
      setError(err.message)
      setPhase('setup')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCards, discoveryMode])

  const handleKnew = useCallback(async (card) => {
    const newKnew = [...knew, card]
    setKnew(newKnew)
    addSessionXP(10)

    if (user?.id && sessionConfig) {
      await supabase.from('learned_words').upsert(
        { user_id: user.id, target_lang: sessionConfig.target, word: card.word, translation: card.translation, mastery: 1 },
        { onConflict: 'user_id,target_lang,word', ignoreDuplicates: false }
      )
    }
    advance(newKnew, missed)
  }, [knew, missed, addSessionXP, user, sessionConfig])

  const handleDidntKnow = useCallback((card) => {
    const newMissed = [...missed, card]
    setMissed(newMissed)
    advance(knew, newMissed)
  }, [knew, missed])

  const advance = (k, m) => {
    if (k.length + m.length >= cards.length) {
      // Persist full card objects with metadata before switching to score screen
      const enriched = cards.map((c) => ({
        ...c,
        level: sessionConfig?.level ?? 'beginner',
        location: sessionConfig?.location ?? null,
        targetLang: sessionConfig?.target ?? targetLang,
        savedAt: new Date().toISOString(),
      }))
      addCards(enriched)
      // Sync to Supabase in background (non-blocking)
      syncCardsToSupabase(enriched, deviceId)
      // Record seen word strings for next-session dedup
      const newWords = cards.map((c) => c.word)
      setSeenWords((prev) => {
        const merged = [...new Set([...prev, ...newWords])]
        return merged
      })
      setPhase('congrats')
    } else {
      setCurrentIndex(k.length + m.length)
    }
  }

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
        <Link to="/mes-fiches"
          className="text-xs font-display px-3 py-1.5 rounded-[6px] transition-colors"
          style={{ color: '#8A7A68', border: '1px solid #2E2820', background: '#1E1A15', textDecoration: 'none' }}>
          Mes fiches
        </Link>
        {phase === 'playing' && (
          <div className="flex items-center gap-3">
            <div className="w-28 h-1 rounded-full overflow-hidden" style={{ background: '#2E2820' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((knew.length + missed.length) / cards.length) * 100}%`,
                  background: '#C8920A',
                }} />
            </div>
            <span className="text-xs font-display" style={{ color: '#4A3F35' }}>
              {knew.length + missed.length}/{cards.length}
            </span>
          </div>
        )}
      </header>

      {/* Contenu */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">

        {/* Erreur */}
        {error && phase === 'setup' && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 px-5 py-3 rounded-[8px] text-sm font-sans z-50"
            style={{ background: '#301A1A', border: '1px solid #603030', color: '#E08080' }}>
            ⚠ {error}
          </div>
        )}

        {phase === 'setup' && (
          <SetupScreen nativeLang={nativeLang} targetLang={targetLang} level={level} savedCards={savedCards} onStart={startSession} discoveryMode={discoveryMode} setDiscoveryMode={setDiscoveryMode} />
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
            <p className="text-sm font-display" style={{ color: '#4A3F35' }}>
              {sessionConfig?.location?.emoji} Vous entrez dans {sessionConfig?.location?.name}…
            </p>
          </div>
        )}

        {phase === 'playing' && cards[currentIndex] && (
          <FlashCard
            card={cards[currentIndex]}
            index={currentIndex}
            total={cards.length}
            level={sessionConfig?.level}
            targetLang={sessionConfig?.target}
            onKnew={handleKnew}
            onDidntKnow={handleDidntKnow}
          />
        )}

        {phase === 'congrats' && (
          <CongratulationsCard
            location={sessionConfig?.location}
            total={cards.length}
            targetLang={sessionConfig?.target}
            nativeLang={sessionConfig?.native}
            onRestart={() => {
              setCurrentIndex(0)
              setKnew([])
              setMissed([])
              setPhase('playing')
            }}
            onContinue={() => startSession({ ...sessionConfig, seen: seenWords })}
            onNewTheme={() => { setPhase('setup'); setCards([]); setKnew([]); setMissed([]); setSeenWords([]) }}
          />
        )}
      </main>
    </div>
  )
}

