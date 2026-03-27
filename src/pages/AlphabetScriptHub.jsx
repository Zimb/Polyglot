import React from 'react'
import { Link, useParams } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getScript } from '../lib/scripts'
import useT from '../lib/useT'

export default function AlphabetScriptHub() {
  const { scriptId } = useParams()
  const { targetLang, alphabetCards } = useAppStore()
  const t = useT()

  const scriptDef = getScript(targetLang, scriptId)
  const key = `${targetLang}_${scriptId}`
  const cards = alphabetCards[key] ?? []
  const linksReady = cards.length >= 5

  if (!scriptDef) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0C0A08' }}>
        <p style={{ color: '#4A3F35' }}>Script not found</p>
      </div>
    )
  }

  const activities = [
    {
      icon: '🃏',
      label: 'Flashcards',
      desc: t('flashcards_alpha_desc'),
      to: `/alphabet/${scriptId}/flashcards`,
      linkState: undefined,
      disabled: false,
    },
    {
      icon: '🔗',
      label: t('links_game_label'),
      desc: t('links_desc'),
      // Pass alphabet cards to Links game via router state
      to: '/links',
      linkState: { alphCards: cards, returnTo: `/alphabet/${scriptId}` },
      disabled: !linksReady,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1E1A15' }}>
        <Link to="/vocabulary" style={{ textDecoration: 'none' }}>
          <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
            poly<span style={{ color: '#C8920A' }}>g</span>lot
          </span>
        </Link>
        <Link to="/vocabulary"
          style={{ color: '#4A3F35', textDecoration: 'none', fontSize: '13px', fontFamily: 'inherit' }}>
          {t('back')}
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col gap-8"
        style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>

        {/* Script info card */}
        <div className="rounded-[12px] px-5 py-4 flex items-center gap-4"
          style={{ background: '#1A1410', border: '1px solid #2E2820' }}>
          <div className="rounded-[10px] w-14 h-14 flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(200,146,10,0.08)', border: '1px solid rgba(200,146,10,0.18)' }}>
            <span className="font-mono font-bold" style={{ fontSize: '22px', color: '#F0E6D3', lineHeight: 1 }}>
              {scriptDef.char}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
              {scriptDef.label}
            </p>
            <p className="text-xs font-sans mt-0.5" style={{ color: '#4A3F35' }}>
              {cards.length > 0 ? t('n_generated', { n: cards.length }) : t('not_generated')}
            </p>
          </div>
        </div>

        {/* Activity cards */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>
            {t('vocabulary_section')}
          </p>

          {activities.map((act) => {
            const card = (
              <div className="rounded-[12px] p-5 flex items-center gap-4"
                style={{
                  background: '#1A1410',
                  border: '1px solid #2E2820',
                  opacity: act.disabled ? 0.45 : 1,
                }}>
                <div className="rounded-[10px] w-12 h-12 flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,146,10,0.10)', border: '1px solid rgba(200,146,10,0.18)' }}>
                  <span style={{ fontSize: '22px' }}>{act.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-base" style={{ color: '#F0E6D3' }}>
                    {act.label}
                  </p>
                  <p className="text-xs mt-0.5 font-sans" style={{ color: '#4A3F35' }}>
                    {act.disabled ? t('need_cards', { n: cards.length }) : act.desc}
                  </p>
                </div>
                {!act.disabled && <span style={{ color: '#4A3F35', fontSize: '18px', flexShrink: 0 }}>→</span>}
              </div>
            )
            return act.disabled ? (
              <div key={act.label}>{card}</div>
            ) : (
              <Link key={act.label} to={act.to} state={act.linkState} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
