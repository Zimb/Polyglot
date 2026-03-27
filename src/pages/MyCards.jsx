import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { fetchCardsFromSupabase, clearCardsFromSupabase } from '../lib/cards'
import useT from '../lib/useT'
import { getLang } from '../lib/languages'

const LEVEL_COLORS = {
  beginner:     { bg: 'rgba(90,180,140,0.12)', border: 'rgba(90,180,140,0.3)',  text: '#90C8A0' },
  intermediate: { bg: 'rgba(200,146,10,0.12)', border: 'rgba(200,146,10,0.35)', text: '#E8A820' },
  advanced:     { bg: 'rgba(180,80,80,0.12)',  border: 'rgba(180,80,80,0.3)',   text: '#E08080' },
}

export default function MyCards() {
  const { savedCards, clearSavedCards, setSavedCards, deviceId } = useAppStore()
  const t = useT()

  const [filterLang, setFilterLang] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterLocation, setFilterLocation] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load from Supabase on mount, merge with local store
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const remote = await fetchCardsFromSupabase(deviceId)
      if (cancelled) return
      if (remote.length > 0) {
        // Merge remote into local (remote is source of truth)
        setSavedCards(remote)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClearAll = async () => {
    if (!window.confirm(t('confirm_clear'))) return
    clearSavedCards()
    await clearCardsFromSupabase(deviceId)
  }

  // Collect unique locations from saved cards
  const locations = useMemo(() => {
    const seen = new Map()
    savedCards.forEach((c) => {
      if (c.location && !seen.has(c.location.id)) {
        seen.set(c.location.id, c.location)
      }
    })
    return [...seen.values()]
  }, [savedCards])

  const langs = useMemo(() => {
    const seen = new Set()
    return savedCards
      .filter((c) => {
        if (!c.targetLang || seen.has(c.targetLang)) return false
        seen.add(c.targetLang)
        return true
      })
      .map((c) => getLang(c.targetLang))
      .filter(Boolean)
  }, [savedCards])

  const filtered = useMemo(() => {
    return savedCards.filter((c) => {
      if (filterLang !== 'all' && c.targetLang !== filterLang) return false
      if (filterLevel !== 'all' && c.level !== filterLevel) return false
      if (filterLocation !== 'all' && c.location?.id !== filterLocation) return false
      return true
    })
  }, [savedCards, filterLang, filterLevel, filterLocation])

  // Group filtered cards by level
  const grouped = useMemo(() => {
    const levels = ['beginner', 'intermediate', 'advanced']
    return levels
      .map((lvl) => ({ level: lvl, cards: filtered.filter((c) => c.level === lvl) }))
      .filter((g) => g.cards.length > 0)
  }, [filtered])

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
        <div className="flex items-center gap-3">
          <span className="text-xs font-display" style={{ color: '#4A3F35' }}>
            {t('cards_label', { n: savedCards.length })}
          </span>
          {savedCards.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-display px-3 py-1.5 rounded-[6px] transition-colors"
              style={{ color: '#603030', border: '1px solid #3D2020', background: '#1E1A15' }}>
              {t('clear_all')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 py-8 max-w-2xl mx-auto w-full gap-6">

        {/* Titre */}
        <div>
          <p className="text-xs font-display uppercase tracking-widest mb-1"
            style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>
            {t('library')}
          </p>
          <h1 className="font-display font-bold text-2xl" style={{ color: '#F0E6D3' }}>
            {t('my_cards_title')}
          </h1>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center gap-4">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
            <p className="text-sm font-display" style={{ color: '#4A3F35' }}>{t('loading')}</p>
          </div>
        ) : savedCards.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
            <span style={{ fontSize: '48px' }}>📚</span>
            <p className="font-display text-sm" style={{ color: '#4A3F35' }}>
              {t('no_cards')}
            </p>
            <Link to="/flashcards"
              className="mt-2 px-4 py-2 font-display text-sm rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410', textDecoration: 'none' }}>
              {t('go_to_flashcards')}
            </Link>
          </div>
        ) : (
          <>
            {/* Filtres — niveaux */}
            <div className="flex flex-col gap-3">
              {/* Filtres — langues */}
              {langs.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterLang('all')}
                    className="px-3 py-1.5 text-xs font-display rounded-full transition-colors"
                    style={{
                      background: filterLang === 'all' ? '#C8920A' : '#1E1A15',
                      border: filterLang === 'all' ? '1px solid #C8920A' : '1px solid #2E2820',
                      color: filterLang === 'all' ? '#1A1410' : '#8A7A68',
                    }}>
                    {t('all_languages')}
                  </button>
                  {langs.map((lang) => (
                    <button key={lang.code} onClick={() => setFilterLang(lang.code)}
                      className="px-3 py-1.5 text-xs font-display rounded-full transition-colors flex items-center gap-1.5"
                      style={{
                        background: filterLang === lang.code ? '#C8920A' : '#1E1A15',
                        border: filterLang === lang.code ? '1px solid #C8920A' : '1px solid #2E2820',
                        color: filterLang === lang.code ? '#1A1410' : '#8A7A68',
                      }}>
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {[{ key: 'all', labelKey: 'all_levels' },
                  { key: 'beginner', labelKey: 'beginner' },
                  { key: 'intermediate', labelKey: 'intermediate' },
                  { key: 'advanced', labelKey: 'advanced' }].map(({ key, labelKey }) => (
                  <button key={key} onClick={() => setFilterLevel(key)}
                    className="px-3 py-1.5 text-xs font-display rounded-full transition-colors"
                    style={{
                      background: filterLevel === key ? '#C8920A' : '#1E1A15',
                      border: filterLevel === key ? '1px solid #C8920A' : '1px solid #2E2820',
                      color: filterLevel === key ? '#1A1410' : '#8A7A68',
                    }}>
                    {t(labelKey)}
                  </button>
                ))}
              </div>

              {/* Filtres — lieux */}
              {locations.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterLocation('all')}
                    className="px-3 py-1.5 text-xs font-sans rounded-full transition-colors"
                    style={{
                      background: filterLocation === 'all' ? 'rgba(200,146,10,0.15)' : '#161210',
                      border: filterLocation === 'all' ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                      color: filterLocation === 'all' ? '#E8A820' : '#4A3F35',
                    }}>
                    {t('all_locations')}
                  </button>
                  {locations.map((loc) => (
                    <button key={loc.id} onClick={() => setFilterLocation(loc.id)}
                      className="px-3 py-1.5 text-xs font-sans rounded-full transition-colors flex items-center gap-1"
                      style={{
                        background: filterLocation === loc.id ? 'rgba(200,146,10,0.15)' : '#161210',
                        border: filterLocation === loc.id ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                        color: filterLocation === loc.id ? '#E8A820' : '#4A3F35',
                      }}>
                      <span>{loc.emoji}</span>
                      <span>{loc.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Résultats */}
            {filtered.length === 0 ? (
              <p className="text-sm font-sans text-center py-10" style={{ color: '#4A3F35' }}>
                {t('no_results')}
              </p>
            ) : (
              <div className="flex flex-col gap-8">
                {grouped.map(({ level, cards }) => {
                  const lc = LEVEL_COLORS[level]
                  return (
                    <div key={level}>
                      {/* Sous-titre niveau */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-display uppercase tracking-widest"
                          style={{ color: lc.text, letterSpacing: '0.12em' }}>
                          {t(level)}
                        </span>
                        <div className="flex-1 h-px" style={{ background: lc.border }} />
                        <span className="text-xs font-display" style={{ color: lc.text, opacity: 0.6 }}>
                          {cards.length}
                        </span>
                      </div>

                      {/* Grille de fiches */}
                      <div className="flex flex-col gap-2">
                        {cards.map((card, i) => {
                          const cardId = `${level}-${i}-${card.word}`
                          const isOpen = expandedId === cardId
                          return (
                            <div
                              key={cardId}
                              onClick={() => setExpandedId(isOpen ? null : cardId)}
                              className="cursor-pointer rounded-[10px] transition-all"
                              style={{
                                background: isOpen ? '#1E1A15' : '#161210',
                                border: isOpen ? `1px solid ${lc.border}` : '1px solid #1E1A15',
                                padding: isOpen ? '14px 16px' : '10px 16px',
                              }}>
                              {/* Ligne principale */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Tag lieu */}
                                  {card.location && (
                                    <span className="text-sm flex-shrink-0" title={card.location.name}>
                                      {card.location.emoji}
                                    </span>
                                  )}
                                  {/* Mot */}
                                  <span className="font-mono font-bold truncate"
                                    style={{ color: '#F5EDD8', fontSize: '16px' }}>
                                    {card.word}
                                  </span>
                                  {card.phonetic && !isOpen && (
                                    <span className="font-mono text-xs hidden sm:block"
                                      style={{ color: '#4A3F35' }}>
                                      [{card.phonetic}]
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="font-sans text-sm" style={{ color: '#8A7A68' }}>
                                    {card.translation}
                                  </span>
                                  <span className="font-display text-xs" style={{ color: '#2E2820' }}>
                                    {isOpen ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>

                              {/* Détail déplié */}
                              {isOpen && (
                                <div className="mt-3 pt-3 flex flex-col gap-2"
                                  style={{ borderTop: '1px solid #2E2820' }}>
                                  {card.phonetic && (
                                    <p className="font-mono text-xs" style={{ color: '#7A6A58' }}>
                                      [{card.phonetic}]
                                    </p>
                                  )}
                                  <p className="font-mono text-sm italic" style={{ color: 'rgba(245,237,216,0.75)' }}>
                                    "{card.example}"
                                  </p>
                                  <p className="font-mono text-xs" style={{ color: '#4A3F35' }}>
                                    "{card.exampleTranslation}"
                                  </p>
                                  {card.location && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="text-xs" style={{ fontSize: '12px' }}>{card.location.emoji}</span>
                                      <span className="text-xs font-display" style={{ color: '#4A3F35' }}>
                                        {card.location.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
