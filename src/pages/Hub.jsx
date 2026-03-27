import React from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useT from '../lib/useT'
import { getScripts } from '../lib/scripts'

export default function Hub() {
  const { nativeLang, targetLang, savedCards, alphabetCards, savedDialogues } = useAppStore()
  const nativeObj = getLang(nativeLang)
  const targetObj = getLang(targetLang)
  const t = useT()

  const scripts = getScripts(targetLang)
  const cardsForLang = savedCards.filter((c) => c.targetLang === targetLang).length
  const linksReady = cardsForLang >= 5

  // Count unlocked dialogue words for FillBlank badge
  const dialogueWordsCount = (savedDialogues ?? []).filter(
    d => d.targetLang === targetLang
  ).reduce((sum, d) => sum + (d.lines ?? []).reduce((s, l) => s + (l.blankWords?.length ?? 0), 0), 0)

  const comingSoon = [
    { icon: '📝', label: t('quiz_label') },
    { icon: '🗣️', label: t('ai_dialog_label') },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>

      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
          poly<span style={{ color: '#C8920A' }}>g</span>lot
        </span>
        <Link to="/mes-fiches"
          className="flex items-center gap-2 text-xs font-display px-3 py-1.5 rounded-[6px]"
          style={{ color: '#8A7A68', border: '1px solid #2E2820', background: '#1E1A15', textDecoration: 'none' }}>
          {t('my_cards')}
          {cardsForLang > 0 && (
            <span className="font-mono font-bold" style={{ color: '#C8920A' }}>{cardsForLang}</span>
          )}
        </Link>
      </header>

      <main className="flex-1 px-6 pb-14 flex flex-col gap-10" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '52px', lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(200,146,10,0.18))' }}>
              {targetObj?.flag}
            </span>
            <div>
              <h1 className="font-display font-bold leading-none" style={{ fontSize: '26px', color: '#F0E6D3' }}>
                {targetObj?.nativeName}
              </h1>
              <p className="text-xs font-sans mt-1.5" style={{ color: '#4A3F35' }}>
                {nativeObj?.flag} {nativeObj?.nativeName}
                <span style={{ margin: '0 6px', color: '#2E2820' }}>→</span>
                {targetObj?.flag} {targetObj?.nativeName}
              </p>
            </div>
          </div>
          <Link to="/setup"
            className="text-xs font-display px-3 py-1.5 rounded-[6px]"
            style={{ color: '#4A3F35', border: '1px solid #2A2018', background: 'none', textDecoration: 'none', flexShrink: 0 }}>
            {t('change')}
          </Link>
        </div>

        {/* ── Vocabulaire ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#4A3F35', letterSpacing: '0.14em' }}>
            {t('vocabulary_section')}
          </p>

          {/* 2-column grid */}
          <div className="grid grid-cols-2 gap-3">

            {/* Flashcards — always enabled */}
            <Link to="/flashcards" style={{ textDecoration: 'none' }}>
              <div className="rounded-[14px] p-4 flex flex-col justify-between h-full relative"
                style={{ background: '#1A1410', border: '1px solid #2E2820', minHeight: '130px' }}>
                {cardsForLang > 0 && (
                  <span className="absolute top-3 right-3 font-mono text-xs font-bold px-1.5 py-0.5 rounded-[4px] leading-none"
                    style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)' }}>
                    {cardsForLang}
                  </span>
                )}
                <span style={{ fontSize: '30px', lineHeight: 1 }}>🃏</span>
                <div className="mt-3">
                  <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                    Flashcards
                  </p>
                  <p className="text-xs font-sans mt-0.5 leading-snug" style={{ color: '#4A3F35' }}>
                    {t('flashcards_desc')}
                  </p>
                </div>
              </div>
            </Link>

            {/* Links — disabled until 5 cards */}
            {linksReady ? (
              <Link to="/links" style={{ textDecoration: 'none' }}>
                <div className="rounded-[14px] p-4 flex flex-col justify-between h-full relative"
                  style={{ background: '#1A1410', border: '1px solid #2E2820', minHeight: '130px' }}>
                  {cardsForLang > 0 && (
                    <span className="absolute top-3 right-3 font-mono text-xs font-bold px-1.5 py-0.5 rounded-[4px] leading-none"
                      style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)' }}>
                      {cardsForLang}
                    </span>
                  )}
                  <span style={{ fontSize: '30px', lineHeight: 1 }}>🔗</span>
                  <div className="mt-3">
                    <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                      {t('links_game_label')}
                    </p>
                    <p className="text-xs font-sans mt-0.5 leading-snug" style={{ color: '#4A3F35' }}>
                      {t('links_desc')}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-[14px] p-4 flex flex-col justify-between"
                style={{ background: '#131110', border: '1px solid #1C1814', minHeight: '130px', opacity: 0.4, cursor: 'not-allowed' }}>
                <span style={{ fontSize: '30px', lineHeight: 1 }}>🔗</span>
                <div className="mt-3">
                  <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                    {t('links_game_label')}
                  </p>
                  <p className="text-xs font-sans mt-0.5 leading-snug" style={{ color: '#4A3F35' }}>
                    {t('need_cards', { n: cardsForLang })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fill Blank — always enabled, full-width below the grid */}
          <Link to="/fill-blank" style={{ textDecoration: 'none' }}>
            <div className="rounded-[14px] px-4 py-3 flex items-center gap-4 relative"
              style={{ background: '#1A1410', border: '1px solid #2E2820' }}>
              {dialogueWordsCount > 0 && (
                <span className="absolute top-2 right-3 font-mono text-xs font-bold px-1.5 py-0.5 rounded-[4px] leading-none"
                  style={{ background: 'rgba(200,146,10,0.15)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.3)' }}>
                  {dialogueWordsCount}
                </span>
              )}
              <span style={{ fontSize: '26px', lineHeight: 1 }}>✏️</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                  {t('fill_blank_label')}
                </p>
                <p className="text-xs font-sans mt-0.5" style={{ color: '#4A3F35' }}>
                  {t('fill_blank_desc')}
                </p>
              </div>
              <span style={{ color: '#4A3F35', fontSize: '14px', flexShrink: 0 }}>→</span>
            </div>
          </Link>
        </section>

        {/* ── Aventure ──────────────────────────────────────────── */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#4A3F35', letterSpacing: '0.14em' }}>
            Immersion
          </p>
          <Link to="/adventure" style={{ textDecoration: 'none' }}>
            <div className="rounded-[14px] px-4 py-3 flex items-center gap-4"
              style={{ background: '#1A1410', border: '1px solid #2E2820' }}>
              <span style={{ fontSize: '26px', lineHeight: 1 }}>🗺️</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                  Aventure
                </p>
                <p className="text-xs font-sans mt-0.5" style={{ color: '#4A3F35' }}>
                  5 mots → relier → compléter un dialogue
                </p>
              </div>
              <span style={{ color: '#4A3F35', fontSize: '14px', flexShrink: 0 }}>→</span>
            </div>
          </Link>
        </section>

        {/* ── Alphabet ─────────────────────────────────────────────── */}
        {scripts.length > 0 && (
          <section className="flex flex-col gap-3">
            <p className="text-xs font-display uppercase tracking-widest"
              style={{ color: '#4A3F35', letterSpacing: '0.14em' }}>
              {t('alphabet_section')}
            </p>
            <div className="flex flex-col gap-2">
              {scripts.map((script) => {
                const cardCount = (alphabetCards[`${targetLang}_${script.id}`] ?? []).length
                return (
                  <Link key={script.id} to={`/alphabet/${script.id}`} style={{ textDecoration: 'none' }}>
                    <div className="rounded-[12px] px-4 py-3 flex items-center gap-4 transition-colors"
                      style={{ background: '#1A1410', border: '1px solid #2E2820' }}>
                      {/* Script char */}
                      <div className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(200,146,10,0.08)', border: '1px solid rgba(200,146,10,0.15)' }}>
                        <span className="font-mono font-bold" style={{ fontSize: '20px', color: '#C8920A', lineHeight: 1 }}>
                          {script.char}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-sm" style={{ color: '#F0E6D3' }}>
                          {script.label}
                        </p>
                        <p className="text-xs font-sans mt-0.5" style={{ color: '#4A3F35' }}>
                          {cardCount > 0 ? t('n_generated', { n: cardCount }) : t('not_generated')}
                        </p>
                      </div>
                      {cardCount > 0 && (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px]"
                          style={{ background: 'rgba(200,146,10,0.12)', color: '#C8920A', border: '1px solid rgba(200,146,10,0.2)' }}>
                          {cardCount}
                        </span>
                      )}
                      <span style={{ color: '#2E2820', fontSize: '14px', flexShrink: 0 }}>→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Coming soon — pill row ────────────────────────────────── */}
        <section className="flex flex-col gap-2.5">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#232018', letterSpacing: '0.14em' }}>
            {t('coming_soon')}
          </p>
          <div className="flex flex-wrap gap-2">
            {comingSoon.map((item) => (
              <div key={item.label}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[8px]"
                style={{ background: '#111009', border: '1px solid #1A1612', opacity: 0.4 }}>
                <span style={{ fontSize: '13px' }}>{item.icon}</span>
                <span className="font-display text-xs" style={{ color: '#3A3028' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}

