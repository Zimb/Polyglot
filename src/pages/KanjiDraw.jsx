import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getScript } from '../lib/scripts'
import useT from '../lib/useT'
import { fetchAlphabetCardsFromSupabase } from '../lib/cards'

// KanjiVG provides open-source stroke-order SVGs via GitHub
const KANJIVG_BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/'

function charToKanjiVGUrl(char) {
  const code = char.codePointAt(0).toString(16).padStart(5, '0')
  return `${KANJIVG_BASE}${code}.svg`
}

// ─── Drawing Canvas ──────────────────────────────────────────────────────────
function DrawCanvas({ size, ghostChar, onStrokeEnd, onClear, onValidate, clearLabel, validateLabel }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPos = useRef(null)
  const strokeCount = useRef(0)

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches?.[0] ?? e
    return {
      x: (touch.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (touch.clientY - rect.top) * (canvasRef.current.height / rect.height),
    }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    lastPos.current = getPos(e)
  }

  const moveDraw = (e) => {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.strokeStyle = '#F5EDD8'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = (e) => {
    e.preventDefault()
    if (drawing.current) strokeCount.current++
    drawing.current = false
    lastPos.current = null
    onStrokeEnd?.()
  }

  const clear = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    strokeCount.current = 0
  }, [])

  // Expose clear and score-compute to parent via ref trick
  useEffect(() => {
    if (!canvasRef.current) return
    canvasRef.current._clear = clear
    canvasRef.current._getStrokeCount = () => strokeCount.current
    canvasRef.current._computeScore = async (ghostChar, size, drawnStrokes, expectedStrokes) => {
      await document.fonts.ready
      const w = size * 2
      const r = Math.max(18, Math.round(size * 0.12)) // dilation radius ≈ stroke width

      // Draw reference glyph (raw, no filter)
      const refCanvas = document.createElement('canvas')
      refCanvas.width = w; refCanvas.height = w
      const rctx = refCanvas.getContext('2d')
      rctx.font = `bold ${size * 1.5}px "Noto Sans JP", "Hiragino Kaku Gothic Pro", sans-serif`
      rctx.textAlign = 'center'
      rctx.textBaseline = 'middle'
      rctx.fillStyle = 'white'
      rctx.fillText(ghostChar, w / 2, w / 2)
      const refRaw = rctx.getImageData(0, 0, w, w).data
      const userRaw = canvasRef.current.getContext('2d').getImageData(0, 0, w, w).data

      // Separable max-filter (morphological dilation) — works everywhere, no canvas.filter needed
      const dilate = (data) => {
        const alpha = new Uint8Array(w * w)
        for (let i = 0; i < w * w; i++) alpha[i] = data[i * 4 + 3]
        const tmp = new Uint8Array(w * w)
        for (let y = 0; y < w; y++) {
          for (let x = 0; x < w; x++) {
            let m = 0
            for (let dx = -r; dx <= r; dx++) {
              const nx = Math.max(0, Math.min(w - 1, x + dx))
              if (alpha[y * w + nx] > m) m = alpha[y * w + nx]
            }
            tmp[y * w + x] = m
          }
        }
        const out = new Uint8Array(w * w)
        for (let y = 0; y < w; y++) {
          for (let x = 0; x < w; x++) {
            let m = 0
            for (let dy = -r; dy <= r; dy++) {
              const ny = Math.max(0, Math.min(w - 1, y + dy))
              if (tmp[ny * w + x] > m) m = tmp[ny * w + x]
            }
            out[y * w + x] = m
          }
        }
        return out
      }

      const refD = dilate(refRaw)
      const userD = dilate(userRaw)

      let refPx = 0, userPx = 0, overlap = 0
      for (let i = 0; i < w * w; i++) {
        const isRef = refD[i] > 40
        const isUser = userD[i] > 40
        if (isRef) refPx++
        if (isUser) userPx++
        if (isRef && isUser) overlap++
      }
      if (userPx === 0 || refPx === 0) return null
      let raw = (2 * overlap) / (refPx + userPx)
      // Apply stroke count ratio if available: missing strokes penalize proportionally
      if (expectedStrokes && drawnStrokes !== null) {
        const strokeRatio = Math.min(1, drawnStrokes / expectedStrokes)
        raw = raw * strokeRatio
      }
      // sqrt curve softens harshness while keeping 0→0 and 1→1
      return Math.min(100, Math.round(Math.sqrt(raw) * 100))
    }
  }, [clear])

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Ghost character — on top of canvas, no pointer events */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: `${size * 0.75}px`, lineHeight: 1,
        color: 'rgba(245,237,216,0.06)',
        pointerEvents: 'none', userSelect: 'none',
        fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic Pro", sans-serif',
      }}>
        {ghostChar}
      </div>

      {/* Grid lines */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <line x1={size / 2} y1={0} x2={size / 2} y2={size}
          stroke="rgba(200,146,10,0.08)" strokeWidth="1" strokeDasharray="6 4" />
        <line x1={0} y1={size / 2} x2={size} y2={size / 2}
          stroke="rgba(200,146,10,0.08)" strokeWidth="1" strokeDasharray="6 4" />
        <line x1={0} y1={0} x2={size} y2={size}
          stroke="rgba(200,146,10,0.04)" strokeWidth="1" strokeDasharray="4 6" />
        <line x1={size} y1={0} x2={0} y2={size}
          stroke="rgba(200,146,10,0.04)" strokeWidth="1" strokeDasharray="4 6" />
      </svg>

      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{
          position: 'relative', width: size, height: size,
          borderRadius: '12px',
          border: '1px solid #2E2820',
          background: '#1A1410',
          touchAction: 'none',
          cursor: 'crosshair',
        }}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
      />

      {/* In-canvas action buttons */}
      <button
        onMouseDown={e => e.preventDefault()}
        onTouchStart={e => { e.preventDefault(); onClear?.() }}
        onClick={onClear}
        style={{
          position: 'absolute', bottom: '10px', left: '10px', zIndex: 5,
          background: 'rgba(12,10,8,0.75)', border: '1px solid #2E2820',
          borderRadius: '8px', padding: '5px 10px',
          color: '#8A7A68', fontSize: '11px', fontFamily: 'monospace',
          cursor: 'pointer', userSelect: 'none',
        }}>🧹 {clearLabel}
      </button>
      <button
        onMouseDown={e => e.preventDefault()}
        onTouchStart={e => { e.preventDefault(); onValidate?.() }}
        onClick={onValidate}
        style={{
          position: 'absolute', bottom: '10px', right: '10px', zIndex: 5,
          background: 'rgba(12,10,8,0.75)', border: '1px solid rgba(74,222,128,0.3)',
          borderRadius: '8px', padding: '5px 10px',
          color: '#4ADE80', fontSize: '11px', fontFamily: 'monospace',
          cursor: 'pointer', userSelect: 'none',
        }}>✓ {validateLabel}
      </button>
    </div>
  )
}

// ─── Stroke Order Viewer ─────────────────────────────────────────────────────
function StrokeOrderViewer({ char, size }) {
  const [svgPaths, setSvgPaths] = useState(null)
  const [activeStroke, setActiveStroke] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setSvgPaths(null)
    setActiveStroke(-1)
    setError(false)
    setLoading(true)

    fetch(charToKanjiVGUrl(char))
      .then((r) => { if (!r.ok) throw new Error(); return r.text() })
      .then((svgText) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(svgText, 'image/svg+xml')
        const paths = Array.from(doc.querySelectorAll('path'))
          .map((p) => p.getAttribute('d'))
          .filter(Boolean)
        if (paths.length === 0) throw new Error()
        setSvgPaths(paths)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [char])

  const playAnimation = useCallback(() => {
    if (!svgPaths) return
    setActiveStroke(0)
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i >= svgPaths.length) {
        clearInterval(interval)
        // keep all strokes visible after animation
      }
      setActiveStroke(i)
    }, 600)
    return () => clearInterval(interval)
  }, [svgPaths])

  // Auto-play once strokes are loaded
  useEffect(() => {
    if (svgPaths) playAnimation()
  }, [svgPaths]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
    </div>
  )

  if (error || !svgPaths) return (
    <div className="flex items-center justify-center text-center px-4"
      style={{ width: size, height: size, color: '#4A3F35', fontSize: '13px', fontFamily: 'monospace' }}>
      Données d'ordre des traits indisponibles
    </div>
  )

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 109 109"
        onClick={playAnimation}
        style={{ background: '#1A1410', borderRadius: '12px', border: '1px solid #2E2820', cursor: 'pointer' }}>
        {/* Ghost character */}
        <text x="54.5" y="88" textAnchor="middle"
          fill="rgba(245,237,216,0.06)"
          fontSize="90"
          fontFamily='"Noto Sans JP", "Hiragino Kaku Gothic Pro", sans-serif'>
          {char}
        </text>
        {/* Grid */}
        <line x1="54.5" y1="0" x2="54.5" y2="109"
          stroke="rgba(200,146,10,0.08)" strokeWidth="0.5" strokeDasharray="3 2" />
        <line x1="0" y1="54.5" x2="109" y2="54.5"
          stroke="rgba(200,146,10,0.08)" strokeWidth="0.5" strokeDasharray="3 2" />
        {svgPaths.map((d, i) => (
          <path key={i} d={d}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            stroke={
              activeStroke === -1
                ? 'rgba(200,146,10,0.15)'
                : i <= activeStroke
                  ? i === activeStroke ? '#C8920A' : '#F5EDD8'
                  : 'rgba(200,146,10,0.08)'
            }
            style={{
              transition: 'stroke 0.3s, opacity 0.3s',
              opacity: activeStroke === -1 ? 1 : i <= activeStroke ? 1 : 0.3,
            }}
          />
        ))}
        {/* Stroke numbers */}
        {activeStroke >= 0 && svgPaths.map((d, i) => {
          if (i > activeStroke) return null
          const match = d.match(/^M\s*([\d.]+)[,\s]+([\d.]+)/)
          if (!match) return null
          return (
            <text key={`n${i}`} x={parseFloat(match[1]) - 4} y={parseFloat(match[2]) - 3}
              fill="#C8920A" fontSize="6" fontFamily="monospace" opacity="0.7">
              {i + 1}
            </text>
          )
        })}
        {/* Replay hint when animation is complete */}
        {activeStroke >= svgPaths.length && (
          <text x="54.5" y="105" textAnchor="middle"
            fill="rgba(200,146,10,0.4)" fontSize="5" fontFamily="monospace">
            ▶ rejouer
          </text>
        )}
      </svg>
    </div>
  )
}

// Scripts with KanjiVG stroke-order data available
const STROKE_ORDER_SCRIPTS = ['kanji_n5', 'hanzi_hsk1']

// ─── Page principale ─────────────────────────────────────────────────────────
export default function KanjiDraw() {
  const { scriptId } = useParams()
  const { search } = useLocation()
  const { targetLang, alphabetCards, setAlphabetCards, deviceId } = useAppStore()
  const t = useT()

  const scriptDef = getScript(targetLang, scriptId)
  const key = `${targetLang}_${scriptId}`
  const cards = alphabetCards[key] ?? []

  const initialIdx = Math.max(0, parseInt(new URLSearchParams(search).get('i') ?? '0', 10))
  const [idx, setIdx] = useState(initialIdx)
  const [showStrokes, setShowStrokes] = useState(false)
  const [score, setScore] = useState(null)
  const [expectedStrokes, setExpectedStrokes] = useState(null)
  const [restoring, setRestoring] = useState(false)
  const canvasRef = useRef(null)

  // Restore from Supabase if localStorage is empty for this script
  useEffect(() => {
    if (cards.length > 0) return
    let cancelled = false
    setRestoring(true)
    fetchAlphabetCardsFromSupabase(deviceId).then((remote) => {
      if (cancelled) return
      const remoteCards = remote[key]
      if (remoteCards && remoteCards.length > 0) {
        setAlphabetCards(key, remoteCards)
      }
      setRestoring(false)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const card = cards[idx] ?? null
  const canvasSize = Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 48 : 320)

  // Fetch expected stroke count from KanjiVG for kanji/hanzi scripts
  useEffect(() => {
    if (!card || !STROKE_ORDER_SCRIPTS.includes(scriptId)) return
    setExpectedStrokes(null)
    fetch(charToKanjiVGUrl(card.character))
      .then(r => r.ok ? r.text() : null)
      .then(svg => {
        if (!svg) return
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        setExpectedStrokes(doc.querySelectorAll('path').length)
      })
      .catch(() => {})
  }, [card?.character, scriptId])

  const handleClear = () => {
    const canvas = document.querySelector('canvas')
    if (canvas?._clear) canvas._clear()
    setScore(null)
  }

  const handleValidate = async () => {
    const canvas = document.querySelector('canvas')
    if (!canvas?._computeScore) return
    const drawnStrokes = canvas._getStrokeCount?.()
    setScore(await canvas._computeScore(card.character, canvasSize, drawnStrokes, expectedStrokes))
  }

  const goTo = (newIdx) => {
    setShowStrokes(false)
    handleClear()
    setIdx(newIdx)
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <Header scriptDef={scriptDef} scriptId={scriptId} t={t} idx={idx} />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          {restoring ? (
            <>
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
              <p className="font-display text-sm" style={{ color: '#4A3F35' }}>Restauration…</p>
            </>
          ) : (
            <>
              <span style={{ fontSize: '64px' }}>✍️</span>
              <p className="font-display text-sm" style={{ color: '#4A3F35' }}>
                {t('draw_need_cards')}
              </p>
              <Link to={`/alphabet/${scriptId}/flashcards`}
                className="px-6 py-3 font-display font-semibold text-sm rounded-[8px]"
                style={{ background: '#C8920A', color: '#1A1410', textDecoration: 'none' }}>
                {t('generate_cards')}
              </Link>
            </>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <Header scriptDef={scriptDef} scriptId={scriptId} t={t} idx={idx}
        progress={`${idx + 1} / ${cards.length}`} />

      <main className="flex-1 flex flex-col items-center px-6 py-8 gap-8">

        {/* Card — matches flashcard dimensions (character header + canvas) */}
        <div style={{
          width: '100%', maxWidth: '320px',
          background: '#1A1410', border: '1px solid #2E2820', borderRadius: '16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
        }}>
          {/* Character header — same visual weight as flashcard front face */}
          <div style={{
            width: '100%', height: '96px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '4px', borderBottom: '1px solid #2E2820',
          }}>
            <span style={{
              fontFamily: 'monospace', fontWeight: 700,
              fontSize: card.character.length > 3 ? '44px' : '60px',
              lineHeight: 1, color: '#F5EDD8',
            }}>
              {card.character}
            </span>
            <p style={{ fontFamily: 'monospace', margin: 0, lineHeight: 1,
              fontSize: card.romanization.length > 6 ? '13px' : '17px', color: '#C8920A' }}>
              {card.romanization}
              {card.translation && card.translation !== card.romanization && (
                <span style={{ color: '#6A5A48', marginLeft: '6px', fontSize: '12px' }}>
                  {card.translation}
                </span>
              )}
            </p>
          </div>

          {/* Stroke toggle tab — only for scripts with KanjiVG data */}
          {STROKE_ORDER_SCRIPTS.includes(scriptId) && (
            <button onClick={() => setShowStrokes((s) => !s)}
              className="w-full font-display text-xs font-medium transition-colors"
              style={{
                height: '36px', flexShrink: 0,
                borderTop: '1px solid #2E2820', borderBottom: 'none',
                background: showStrokes ? 'rgba(200,146,10,0.10)' : 'transparent',
                borderLeft: 'none', borderRight: 'none',
                color: showStrokes ? '#C8920A' : '#4A3F35',
                cursor: 'pointer',
              }}>
              {showStrokes ? t('draw_practice') : t('draw_strokes')}
            </button>
          )}

          {/* Canvas or stroke viewer */}
          {showStrokes ? (
            <StrokeOrderViewer char={card.character} size={canvasSize} />
          ) : (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <DrawCanvas
                size={canvasSize}
                ghostChar={card.character}
                onClear={handleClear}
                onValidate={handleValidate}
                clearLabel={t('draw_clear')}
                validateLabel={t('draw_validate')}
              />
              {score !== null && (() => {
                const color = score >= 70 ? '#4ADE80' : score >= 45 ? '#F59E0B' : '#F87171'
                const label = score >= 70 ? 'Excellent !' : score >= 45 ? 'Pas mal !' : 'Réessaie !'
                return (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                    background: 'rgba(12,10,8,0.90)', borderRadius: '10px',
                    border: `1px solid ${color}`, padding: '6px 12px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
                  }}>
                    <span style={{ color, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1 }}>
                      {score}%
                    </span>
                    <span style={{ color: 'rgba(245,237,216,0.4)', fontSize: '10px', fontFamily: 'monospace' }}>
                      {label}
                    </span>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 w-full" style={{ maxWidth: '320px' }}>
          <button onClick={() => goTo(idx - 1)} disabled={idx === 0}
            className="w-12 h-12 rounded-[8px] font-display font-bold text-lg"
            style={{
              background: '#1A1410', border: '1px solid #2E2820',
              color: idx === 0 ? '#2E2820' : '#8A7A68',
              cursor: idx === 0 ? 'default' : 'pointer',
            }}>
            ←
          </button>
          <div className="flex-1 flex justify-center gap-1.5 overflow-hidden">
            {cards.slice(Math.max(0, idx - 3), idx + 4).map((c, i) => {
              const realIdx = Math.max(0, idx - 3) + i
              return (
                <button key={realIdx} onClick={() => goTo(realIdx)}
                  className="w-8 h-8 rounded-[6px] font-mono text-xs transition-colors"
                  style={{
                    background: realIdx === idx ? 'rgba(200,146,10,0.15)' : '#1A1410',
                    border: realIdx === idx ? '1px solid rgba(200,146,10,0.4)' : '1px solid #2E2820',
                    color: realIdx === idx ? '#C8920A' : '#4A3F35',
                    cursor: 'pointer', flexShrink: 0,
                  }}>
                  {c.character}
                </button>
              )
            })}
          </div>
          <button onClick={() => goTo(idx + 1)} disabled={idx >= cards.length - 1}
            className="w-12 h-12 rounded-[8px] font-display font-bold text-lg"
            style={{
              background: '#1A1410', border: '1px solid #2E2820',
              color: idx >= cards.length - 1 ? '#2E2820' : '#8A7A68',
              cursor: idx >= cards.length - 1 ? 'default' : 'pointer',
            }}>
            →
          </button>
        </div>

        {/* Back to flashcards link — mirrors the draw_practice link in AlphabetFlashcard */}
        <Link to={`/alphabet/${scriptId}/flashcards?i=${idx}`}
          className="flex items-center justify-center gap-2 w-full py-3 font-display text-sm font-medium rounded-[8px] transition-colors"
          style={{
            maxWidth: '320px',
            background: 'rgba(200,146,10,0.08)',
            border: '1px solid rgba(200,146,10,0.25)',
            color: '#C8920A',
            textDecoration: 'none',
          }}>
          🃏 {t('flashcards_alpha_desc')}
        </Link>

        {/* Mnemonic hint (collapsed) — at the very bottom */}
        {card.mnemonic && (
          <details className="w-full" style={{ maxWidth: '320px' }}>
            <summary className="text-xs font-display cursor-pointer select-none"
              style={{ color: '#4A3F35', listStyle: 'none' }}>
              <span style={{ color: '#C8920A', marginRight: '6px' }}>💡</span>
              {t('mnemonic_short')}
            </summary>
            <p className="text-xs font-sans italic mt-2 pl-5"
              style={{ color: '#6A5A48', lineHeight: 1.5 }}>
              {card.mnemonic}
            </p>
          </details>
        )}
      </main>
    </div>
  )
}

function Header({ scriptDef, scriptId, t, progress, idx }) {
  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #1E1A15' }}>
      <Link to={`/alphabet/${scriptId}/flashcards?i=${idx ?? 0}`} style={{ textDecoration: 'none' }}>
        <span className="font-display text-sm" style={{ color: '#4A3F35' }}>
          ← {scriptDef?.label ?? scriptId}
        </span>
      </Link>
      {progress && (
        <span className="font-mono text-xs" style={{ color: '#4A3F35' }}>{progress}</span>
      )}
    </header>
  )
}
