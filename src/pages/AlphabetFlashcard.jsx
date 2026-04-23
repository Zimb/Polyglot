import React, { useState, useCallback, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getScript } from '../lib/scripts'
import useT from '../lib/useT'
import { speak } from '../lib/tts'
import { syncAlphabetCardsToSupabase, fetchAlphabetCardsFromSupabase } from '../lib/cards'

export default function AlphabetFlashcard() {
  const { scriptId } = useParams()
  const { search } = useLocation()
  const { targetLang, nativeLang, alphabetCards, setAlphabetCards, addAlphabetCards, deviceId } = useAppStore()
  const t = useT()

  const scriptDef = getScript(targetLang, scriptId)
  const key = `${targetLang}_${scriptId}`
  const cards = alphabetCards[key] ?? []

  const initialIdx = Math.max(0, parseInt(new URLSearchParams(search).get('i') ?? '0', 10))
  const [idx, setIdx] = useState(initialIdx)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState(null)

  // Restore from Supabase if localStorage is empty for this script
  useEffect(() => {
    if (cards.length > 0) return  // already in local store, nothing to do
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

  const generate = useCallback(async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const batchIndex = scriptDef?.oneBatch
        ? 0
        : Math.floor(cards.length / (scriptDef?.batchSize ?? 20))
      const res = await fetch('/api/alphabet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLang, nativeLang, scriptId, batchIndex }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error ?? 'Generation failed')
      }
      const { cards: newCards } = await res.json()
      if (scriptDef?.oneBatch) {
        setAlphabetCards(key, newCards)
        syncAlphabetCardsToSupabase(deviceId, targetLang, scriptId, newCards)
        setIdx(0)
      } else {
        const prevLen = cards.length
        const merged = [...cards, ...newCards]
        addAlphabetCards(key, newCards)
        syncAlphabetCardsToSupabase(deviceId, targetLang, scriptId, merged)
        // After state update, jump to the first new card
        setIdx(prevLen)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [loading, cards, targetLang, nativeLang, scriptId, scriptDef, key, deviceId, setAlphabetCards, addAlphabetCards])

  const goTo = (newIdx) => {
    if (flipped) {
      setFlipped(false)
      setTimeout(() => setIdx(newIdx), 180)
    } else {
      setIdx(newIdx)
    }
  }

  const currentCard = cards[idx] ?? null
  const isFirst = idx === 0
  const isLast = cards.length > 0 && idx === cards.length - 1
  const canLoadMore = isLast && !scriptDef?.oneBatch

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
        <AlphaHeader scriptDef={scriptDef} scriptId={scriptId} t={t} />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <span style={{ fontSize: '72px', lineHeight: 1, color: '#F5EDD8', fontFamily: 'inherit' }}>
            {scriptDef?.char ?? '🔤'}
          </span>
          {restoring ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: '#C8920A', borderTopColor: 'transparent' }} />
              <p className="text-sm font-display" style={{ color: '#4A3F35' }}>Restauration…</p>
            </div>
          ) : (
          <div>
            <p className="font-display font-bold text-xl" style={{ color: '#F0E6D3' }}>
              {scriptDef?.label}
            </p>
            <p className="text-sm font-sans mt-2 max-w-xs mx-auto" style={{ color: '#4A3F35', lineHeight: 1.6 }}>
              {t('generate_prompt')}
            </p>
          </div>
          )}
          {error && (
            <p className="text-xs font-mono px-4 py-2 rounded-[6px]"
              style={{ color: '#E09898', background: 'rgba(224,128,128,0.08)', border: '1px solid rgba(224,128,128,0.2)' }}>
              {error}
            </p>
          )}
          {!restoring && (
          <button
            onClick={generate}
            disabled={loading}
            className="px-8 py-3.5 font-display font-semibold text-base rounded-[8px]"
            style={{
              background: loading ? '#2E2820' : '#C8920A',
              color: loading ? '#6A5A48' : '#1A1410',
              cursor: loading ? 'default' : 'pointer',
              border: 'none',
              transition: 'background 0.2s',
            }}>
            {loading ? t('loading') : t('generate_cards')}
          </button>
          )}
        </main>
      </div>
    )
  }

  // ── Study mode ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <AlphaHeader
        scriptDef={scriptDef}
        scriptId={scriptId}
        t={t}
        progress={`${idx + 1} / ${cards.length}`}
      />

      <main className="flex-1 flex flex-col items-center px-6 py-8 gap-8">

        {/* Flip card */}
        <div
          onClick={() => setFlipped((f) => !f)}
          style={{ width: '100%', maxWidth: '320px', perspective: '1000px', cursor: 'pointer' }}>
          <div style={{
            position: 'relative',
            paddingBottom: '130%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            {/* Front: big character */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: '#1A1410',
              border: '1px solid #2E2820',
              borderRadius: '16px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '20px',
            }}>
              <span style={{
                fontSize: currentCard.character.length > 3 ? '56px' : '90px',
                lineHeight: 1,
                color: '#F5EDD8',
              }}>
                {currentCard.character}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); speak(currentCard.character, targetLang) }}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-display text-xs transition-colors"
                style={{
                  background: 'rgba(200,146,10,0.10)',
                  border: '1px solid rgba(200,146,10,0.25)',
                  color: '#C8920A',
                  cursor: 'pointer',
                }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
                {t('listen')}
              </button>
            </div>

            {/* Back: romanization + info */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#1E1A15',
              border: '1px solid rgba(200,146,10,0.35)',
              borderRadius: '16px',
              display: 'flex', flexDirection: 'column',
              padding: '20px 20px 16px',
              gap: '0',
              overflowY: 'auto',
            }}>
              {/* Romanization */}
              <div className="text-center pb-3" style={{ borderBottom: '1px solid #2E2820', flexShrink: 0 }}>
                <p className="font-mono font-bold"
                  style={{ fontSize: currentCard.romanization.length > 6 ? '24px' : '36px', color: '#C8920A', lineHeight: 1 }}>
                  {currentCard.romanization}
                </p>
                {currentCard.translation && currentCard.translation !== currentCard.romanization && (
                  <p className="font-sans text-sm mt-1.5" style={{ color: '#8A7A68' }}>
                    {currentCard.translation}
                  </p>
                )}
              </div>

              {/* Sound hint — label adapts per script */}
              {currentCard.soundHint && (
                <div style={{ paddingTop: '10px', flexShrink: 0 }}>
                  <p className="text-xs font-display uppercase mb-1" style={{ color: '#4A3F35', letterSpacing: '0.08em' }}>
                    {scriptId.startsWith('kanji') || scriptId.startsWith('hanzi')
                      ? 'Lectures'
                      : t('sound')}
                  </p>
                  <p className="text-sm font-sans" style={{ color: '#D4C4A8', lineHeight: 1.4 }}>
                    {currentCard.soundHint}
                  </p>
                </div>
              )}

              {/* Mnemonic */}
              {currentCard.mnemonic && (
                <div style={{ paddingTop: '8px', flexShrink: 0 }}>
                  <p className="text-xs font-display uppercase mb-1" style={{ color: '#4A3F35', letterSpacing: '0.08em' }}>
                    {t('mnemonic_short')}
                  </p>
                  <p className="text-sm font-sans italic" style={{ color: '#8A7A68', lineHeight: 1.4 }}>
                    {currentCard.mnemonic}
                  </p>
                </div>
              )}

              {/* Example word — big, centered hero block */}
              {currentCard.exampleWord && (
                <div style={{
                  marginTop: 'auto',
                  paddingTop: '12px',
                  borderTop: '1px solid #2A2420',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', textAlign: 'center', gap: '4px',
                }}>
                  <p className="font-mono font-bold" style={{ fontSize: '28px', color: '#F5EDD8', lineHeight: 1.1 }}>
                    {currentCard.exampleWord}
                  </p>
                  {currentCard.exampleRomanization && (
                    <p className="font-mono text-sm" style={{ color: '#C8920A' }}>
                      {currentCard.exampleRomanization}
                    </p>
                  )}
                  {currentCard.exampleMeaning && (
                    <p className="font-sans text-sm" style={{ color: '#6A5A48' }}>
                      {currentCard.exampleMeaning}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation row */}
        <div className="flex items-center gap-3 w-full" style={{ maxWidth: '320px' }}>
          <button
            onClick={() => goTo(idx - 1)}
            disabled={isFirst}
            className="w-12 h-12 rounded-[8px] font-display font-bold text-lg"
            style={{
              background: '#1A1410', border: '1px solid #2E2820',
              color: isFirst ? '#2E2820' : '#8A7A68',
              cursor: isFirst ? 'default' : 'pointer',
            }}>
            ←
          </button>

          <span className="flex-1 text-center font-mono text-xs" style={{ color: '#4A3F35' }}>
            {idx + 1} / {cards.length}
          </span>

          {canLoadMore ? (
            <button
              onClick={generate}
              disabled={loading}
              className="w-12 h-12 rounded-[8px] font-display font-bold text-lg"
              style={{
                background: 'rgba(200,146,10,0.10)',
                border: '1px solid rgba(200,146,10,0.35)',
                color: loading ? '#4A3F35' : '#C8920A',
                cursor: loading ? 'default' : 'pointer',
              }}>
              {loading ? '…' : '+'}
            </button>
          ) : (
            <button
              onClick={() => goTo(idx + 1)}
              disabled={isLast}
              className="w-12 h-12 rounded-[8px] font-display font-bold text-lg"
              style={{
                background: '#1A1410', border: '1px solid #2E2820',
                color: isLast ? '#2E2820' : '#8A7A68',
                cursor: isLast ? 'default' : 'pointer',
              }}>
              →
            </button>
          )}
        </div>

        {/* Load next batch hint */}
        {canLoadMore && !loading && (
          <p className="text-xs font-sans text-center" style={{ color: '#4A3F35' }}>
            {t('load_next_batch')}
          </p>
        )}

        {/* Drawing practice link — only for drawable scripts */}
        {cards.length > 0 && ['hiragana', 'katakana', 'kanji_n5', 'hangul', 'hanzi_hsk1'].includes(scriptId) && (
          <Link to={`/alphabet/${scriptId}/draw?i=${idx}`}
            className="flex items-center justify-center gap-2 w-full py-3 font-display text-sm font-medium rounded-[8px] transition-colors"
            style={{
              maxWidth: '320px',
              background: 'rgba(200,146,10,0.08)',
              border: '1px solid rgba(200,146,10,0.25)',
              color: '#C8920A',
              textDecoration: 'none',
            }}>
            ✍️ {t('draw_practice')}
          </Link>
        )}

        {error && (
          <p className="text-xs font-mono text-center px-4 py-2 rounded-[6px]"
            style={{ color: '#E09898', background: 'rgba(224,128,128,0.08)', border: '1px solid rgba(224,128,128,0.2)' }}>
            {error}
          </p>
        )}
      </main>
    </div>
  )
}

function AlphaHeader({ scriptDef, scriptId, t, progress }) {
  return (
    <header className="flex items-center justify-between px-6 py-4"
      style={{ borderBottom: '1px solid #1E1A15' }}>
      <Link to={`/alphabet/${scriptId}`} style={{ textDecoration: 'none' }}>
        <span style={{ color: '#4A3F35', fontSize: '13px', fontFamily: 'inherit' }}>
          {t('back')}
        </span>
      </Link>
      <span className="text-xs font-display uppercase tracking-widest"
        style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
        {scriptDef?.label ?? scriptId}
      </span>
      <span className="font-mono text-xs" style={{ color: '#2E2820', minWidth: '48px', textAlign: 'right' }}>
        {progress ?? ''}
      </span>
    </header>
  )
}
