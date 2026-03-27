import React, { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useT from '../lib/useT'

// ─── Constants ────────────────────────────────────────────────────────────────
const PAIR_COLORS = ['#C8920A', '#90C8A0', '#E09898', '#8AABE0', '#C8A0D8']
const ITEM_H = 56   // button height in px
const GAP = 8       // gap between rows in px
const ROW_H = ITEM_H + GAP
const SVG_W = 44    // width of connector SVG area
const N = 5         // pairs per round

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function initGame(eligible) {
  const pairs = shuffle([...eligible]).slice(0, N)
  const n = pairs.length
  return {
    pairs,
    leftOrder: shuffle([...Array(n).keys()]),   // leftOrder[visualRow] = pairIdx
    rightOrder: shuffle([...Array(n).keys()]),  // rightOrder[visualRow] = pairIdx
    matches: [],       // [{pairIdx, colorIdx}]
    selectedLeft: null, // pairIdx
    wrongFlash: null,  // {left: pairIdx, right: pairIdx}
  }
}

function retryGame(currentPairs) {
  const n = currentPairs.length
  return {
    pairs: currentPairs,
    leftOrder: shuffle([...Array(n).keys()]),
    rightOrder: shuffle([...Array(n).keys()]),
    matches: [],
    selectedLeft: null,
    wrongFlash: null,
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Links() {
  const { nativeLang, targetLang, savedCards } = useAppStore()
  const targetObj = getLang(targetLang)
  const t = useT()
  const location = useLocation()
  const alphCards = location.state?.alphCards ?? null
  const returnTo = location.state?.returnTo ?? '/vocabulary'

  // Deduplicate by word to avoid same word appearing twice
  const eligible = useMemo(() => {
    if (alphCards) return alphCards
    const seen = new Set()
    return savedCards.filter((c) => {
      if (c.targetLang !== targetLang) return false
      if (seen.has(c.word)) return false
      seen.add(c.word)
      return true
    })
  }, [savedCards, targetLang, alphCards])

  const [game, setGame] = useState(() => initGame(eligible))
  const { pairs, leftOrder, rightOrder, matches, selectedLeft, wrongFlash } = game

  const matchedSet = new Set(matches.map((m) => m.pairIdx))

  const getMatchInfo = (pairIdx) => matches.find((m) => m.pairIdx === pairIdx)

  const handleLeftClick = (pairIdx) => {
    if (matchedSet.has(pairIdx) || wrongFlash) return
    setGame((g) => ({ ...g, selectedLeft: g.selectedLeft === pairIdx ? null : pairIdx }))
  }

  const handleRightClick = (pairIdx) => {
    if (matchedSet.has(pairIdx) || wrongFlash || selectedLeft === null) return
    if (selectedLeft === pairIdx) {
      setGame((g) => ({
        ...g,
        matches: [...g.matches, { pairIdx, colorIdx: g.matches.length }],
        selectedLeft: null,
      }))
    } else {
      const fl = { left: selectedLeft, right: pairIdx }
      setGame((g) => ({ ...g, wrongFlash: fl }))
      setTimeout(() => setGame((g) => ({ ...g, wrongFlash: null, selectedLeft: null })), 600)
    }
  }

  const complete = matches.length === pairs.length && pairs.length >= N
  const n = pairs.length
  const svgH = n * ROW_H

  // Build SVG paths for each match
  const svgPaths = matches.map((m) => {
    const lv = leftOrder.indexOf(m.pairIdx)
    const rv = rightOrder.indexOf(m.pairIdx)
    const y1 = lv * ROW_H + ITEM_H / 2
    const y2 = rv * ROW_H + ITEM_H / 2
    const half = SVG_W / 2
    return {
      d: `M 0 ${y1} C ${half} ${y1}, ${half} ${y2}, ${SVG_W} ${y2}`,
      color: PAIR_COLORS[m.colorIdx % PAIR_COLORS.length],
    }
  })

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (eligible.length < N) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <Header t={t} />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center">
          <span style={{ fontSize: '52px' }}>🔗</span>
          <div>
            <p className="font-display font-semibold text-lg" style={{ color: '#F0E6D3' }}>
              {t('not_enough_cards')}
            </p>
            <p className="mt-2 text-sm font-sans" style={{ color: '#4A3F35' }}>
              {t('need_n_words', { n: N, lang: targetObj?.nativeName })}
            </p>
            <p className="mt-1 text-xs font-mono" style={{ color: '#2E2820' }}>
              {t('cards_available', { n: eligible.length, total: N })}
            </p>
          </div>
          <Link to={returnTo}
            className="px-5 py-3 font-display font-semibold text-sm rounded-[8px]"
            style={{ background: '#C8920A', color: '#1A1410', textDecoration: 'none' }}>
            {t('flashcards_btn')}
          </Link>
        </main>
      </div>
    )
  }

  // ── Win screen ───────────────────────────────────────────────────────────────
  if (complete) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <Header t={t} />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 animate-slide-up">
          <div className="text-center">
            <p className="font-display font-bold" style={{ fontSize: '56px', lineHeight: 1, color: '#C8920A' }}>
              ✓
            </p>
            <p className="font-display font-bold text-xl mt-2" style={{ color: '#F0E6D3' }}>
              {t('pairs_found', { n: N })}
            </p>
          </div>
          {/* Pairs recap */}
          <div className="w-full max-w-xs flex flex-col gap-2">
            {matches.map((m) => {
              const color = PAIR_COLORS[m.colorIdx % PAIR_COLORS.length]
              const card = pairs[m.pairIdx]
              return (
                <div key={m.pairIdx} className="flex items-center gap-3 px-3 py-2 rounded-[8px]"
                  style={{ background: '#1A1410', border: `1px solid ${color}33` }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-mono text-sm flex-1" style={{ color: '#F0E6D3' }}>{card.word}</span>
                  <span style={{ color: '#2E2820', fontSize: '12px' }}>→</span>
                  <span className="font-sans text-sm flex-1 text-right" style={{ color: '#8A7A68' }}>{card.translation}</span>
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button
              onClick={() => setGame(retryGame(pairs))}
              className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px]"
              style={{ background: '#1E1A15', border: '1px solid #2E2820', color: '#F0E6D3' }}>
              Réessayer
            </button>
            <button
              onClick={() => setGame(initGame(eligible))}
              className="flex-1 py-3 font-display font-semibold text-sm rounded-[8px]"
              style={{ background: '#C8920A', color: '#1A1410', border: 'none', cursor: 'pointer' }}>
              Rejouer
            </button>
          </div>
          <Link to={returnTo}
            className="font-display text-sm"
            style={{ color: '#4A3F35', textDecoration: 'underline' }}>
            Revenir au menu précédent
          </Link>
        </main>
      </div>
    )
  }

  // ── Game board ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <Header t={t} progress={`${matches.length} / ${n}`} />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full" style={{ maxWidth: '400px' }}>
          {/* Hint */}
          <p className="text-xs font-display text-center mb-5" style={{ color: '#4A3F35', letterSpacing: '0.04em' }}>
            {selectedLeft !== null
              ? t('choose_translation')
              : t('select_word')}
          </p>

          {/* Three-column layout: words | SVG lines | translations */}
          <div className="flex items-start">
            {/* Left column — words in target lang */}
            <div className="flex flex-col flex-1" style={{ gap: `${GAP}px` }}>
              {leftOrder.map((pairIdx, vi) => {
                const card = pairs[pairIdx]
                const mi = getMatchInfo(pairIdx)
                const matchColor = mi ? PAIR_COLORS[mi.colorIdx % PAIR_COLORS.length] : null
                const isSelected = selectedLeft === pairIdx
                const isWrong = wrongFlash?.left === pairIdx

                let bg = '#1A1410'
                let border = '#2E2820'
                let textColor = '#F0E6D3'
                if (matchColor) { bg = `${matchColor}18`; border = matchColor; textColor = matchColor }
                else if (isWrong) { bg = 'rgba(224,128,128,0.12)'; border = '#E09898' }
                else if (isSelected) { bg = 'rgba(200,146,10,0.14)'; border = '#C8920A' }

                return (
                  <button
                    key={pairIdx}
                    onClick={() => handleLeftClick(pairIdx)}
                    style={{
                      height: `${ITEM_H}px`,
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: '8px',
                      color: textColor,
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '0 12px',
                      textAlign: 'left',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: matchColor ? 'default' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    {card.word}
                  </button>
                )
              })}
            </div>

            {/* SVG connector */}
            <svg
              width={SVG_W}
              height={svgH}
              style={{ flexShrink: 0, overflow: 'visible' }}>
              {svgPaths.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  stroke={p.color}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Right column — translations in native lang */}
            <div className="flex flex-col flex-1" style={{ gap: `${GAP}px` }}>
              {rightOrder.map((pairIdx, vi) => {
                const card = pairs[pairIdx]
                const mi = getMatchInfo(pairIdx)
                const matchColor = mi ? PAIR_COLORS[mi.colorIdx % PAIR_COLORS.length] : null
                const isWrong = wrongFlash?.right === pairIdx
                const isClickable = selectedLeft !== null && !matchColor && !wrongFlash

                let bg = '#1A1410'
                let border = '#2E2820'
                let textColor = '#8A7A68'
                if (matchColor) { bg = `${matchColor}18`; border = matchColor; textColor = matchColor }
                else if (isWrong) { bg = 'rgba(224,128,128,0.12)'; border = '#E09898' }
                else if (isClickable) { border = '#3E3228' }

                return (
                  <button
                    key={pairIdx}
                    onClick={() => handleRightClick(pairIdx)}
                    style={{
                      height: `${ITEM_H}px`,
                      background: bg,
                      border: `1px solid ${border}`,
                      borderRadius: '8px',
                      color: textColor,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontSize: '13px',
                      padding: '0 12px',
                      textAlign: 'right',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: matchColor ? 'default' : 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    {card.translation}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ progress, t }) {
  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #1E1A15' }}>
      <Link to="/vocabulary" style={{ textDecoration: 'none' }}>
        <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
          poly<span style={{ color: '#C8920A' }}>g</span>lot
        </span>
      </Link>
      {progress ? (
        <span className="text-xs font-display" style={{ color: '#4A3F35' }}>
          {progress} {t ? t('pairs_label') : 'pairs'}
        </span>
      ) : (
        <span className="text-xs font-display uppercase tracking-widest"
          style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
          {t ? t('links_game_label') : 'Word Match'}
        </span>
      )}
    </header>
  )
}
