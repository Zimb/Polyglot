import React from 'react'
import { Link } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { getLang } from '../lib/languages'
import useT from '../lib/useT'

export default function Hub() {
  const { nativeLang, targetLang, savedCards } = useAppStore()
  const nativeObj = getLang(nativeLang)
  const targetObj = getLang(targetLang)
  const t = useT()

  const cardsForLang = savedCards.filter((c) => c.targetLang === targetLang).length
  const linksReady = cardsForLang >= 5

  const activities = [
    { icon: '🃏', label: 'Flashcards', desc: t('flashcards_desc'), to: '/flashcards' },
    { icon: '🔗', label: t('links_game_label'), desc: t('links_desc'), to: '/links' },
  ]

  const comingSoon = [
    { icon: '📝', label: t('quiz_label'), desc: t('quiz_desc') },
    { icon: '🗣️', label: t('ai_dialog_label'), desc: t('ai_dialog_desc') },
    { icon: '✏️', label: t('fill_blank_label'), desc: t('fill_blank_desc') },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0C0A08' }}>
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1E1A15' }}>
        <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
          poly<span style={{ color: '#C8920A' }}>g</span>lot
        </span>
        <Link to="/mes-fiches"
          className="text-xs font-display px-3 py-1.5 rounded-[6px]"
          style={{ color: '#8A7A68', border: '1px solid #2E2820', background: '#1E1A15', textDecoration: 'none' }}>
          {t('my_cards')}{cardsForLang > 0 && (
            <span style={{ color: '#C8920A', marginLeft: '6px' }}>{cardsForLang}</span>
          )}
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col gap-8" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>

        {/* Lang pair */}
        <div className="rounded-[12px] px-5 py-4 flex items-center justify-between"
          style={{ background: '#1A1410', border: '1px solid #2E2820' }}>
          <div>
            <p className="text-xs font-display uppercase tracking-widest mb-2"
              style={{ color: '#4A3F35', letterSpacing: '0.1em' }}>
              {t('i_learn')}
            </p>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{nativeObj?.flag}</span>
              <span style={{ color: '#2E2820', fontSize: '16px', fontWeight: 700 }}>→</span>
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{targetObj?.flag}</span>
              <span className="font-display font-semibold text-base" style={{ color: '#F0E6D3' }}>
                {targetObj?.nativeName}
              </span>
            </div>
          </div>
          <Link to="/setup"
            className="text-xs font-display px-3 py-1.5 rounded-[6px]"
            style={{ color: '#4A3F35', border: '1px solid #2E2820', background: 'none', textDecoration: 'none', flexShrink: 0 }}>
            {t('change')}
          </Link>
        </div>

        {/* Vocabulary section */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>
            {t('vocabulary_section')}
          </p>

          {activities.map((act) => {
            const disabled = act.to === '/links' && !linksReady
            const card = (
              <div className="rounded-[12px] p-5 flex items-center gap-4"
                style={{
                  background: '#1A1410',
                  border: '1px solid #2E2820',
                  opacity: disabled ? 0.45 : 1,
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
                    {disabled ? t('need_cards', { n: cardsForLang }) : act.desc}
                  </p>
                </div>
                {!disabled && <span style={{ color: '#4A3F35', fontSize: '18px', flexShrink: 0 }}>→</span>}
              </div>
            )
            return disabled ? (
              <div key={act.label}>{card}</div>
            ) : (
              <Link key={act.label} to={act.to} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            )
          })}
        </div>

        {/* Coming soon */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-display uppercase tracking-widest"
            style={{ color: '#2E2820', letterSpacing: '0.12em' }}>
            {t('coming_soon')}
          </p>
          {comingSoon.map((item) => (
            <div key={item.label} className="rounded-[12px] p-5 flex items-center gap-4"
              style={{ background: '#141210', border: '1px solid #1E1A15', opacity: 0.4 }}>
              <div className="rounded-[10px] w-12 h-12 flex items-center justify-center flex-shrink-0"
                style={{ background: '#1A1410' }}>
                <span style={{ fontSize: '22px' }}>{item.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-base" style={{ color: '#F0E6D3' }}>
                  {item.label}
                </p>
                <p className="text-xs mt-0.5 font-sans" style={{ color: '#4A3F35' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
