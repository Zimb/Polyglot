import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/useAppStore'
import { LANGUAGES } from '../lib/languages'
import { getT, detectBrowserLang } from '../lib/i18n'

const BG = '#0C0A08'

export default function LangSetup() {
  const { nativeLang, targetLang, setNativeLang, setTargetLang } = useAppStore()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [native, setNative] = useState(nativeLang ?? detectBrowserLang())
  const [target, setTarget] = useState(targetLang !== nativeLang ? (targetLang ?? 'en') : 'en')

  // UI language follows native selection live — great UX for new users
  const t = useMemo(() => getT(native), [native])

  const goToStep2 = () => {
    if (target === native) setTarget(LANGUAGES.find((l) => l.code !== native)?.code ?? 'en')
    setStep(2)
  }

  const confirm = () => {
    setNativeLang(native)
    setTargetLang(target)
    navigate('/hub')
  }

  const langCard = (l, selected, onClick) => (
    <button
      key={l.code}
      onClick={() => onClick(l.code)}
      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-[10px] transition-colors"
      style={{
        background: selected ? 'rgba(200,146,10,0.12)' : '#1A1410',
        border: selected ? '1px solid rgba(200,146,10,0.55)' : '1px solid #2E2820',
      }}>
      <span style={{ fontSize: '26px', lineHeight: 1 }}>{l.flag}</span>
      <span className="text-xs font-display text-center leading-tight"
        style={{ color: selected ? '#E8A820' : '#6A5A48' }}>
        {l.nativeName}
      </span>
    </button>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #1E1A15' }}>
        <span className="font-display font-bold text-lg" style={{ color: '#F0E6D3' }}>
          poly<span style={{ color: '#C8920A' }}>g</span>lot
        </span>
        {step === 2 && (
          <button onClick={() => setStep(1)}
            style={{ color: '#4A3F35', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px' }}>
            {t('back')}
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8" style={{ maxWidth: '440px', margin: '0 auto', width: '100%' }}>
        <div className="mb-5">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className="h-1 flex-1 rounded-full"
                style={{ background: step >= s ? '#C8920A' : '#2E2820' }} />
            ))}
          </div>
          <p className="text-xs font-display uppercase tracking-widest mb-1"
            style={{ color: '#4A3F35', letterSpacing: '0.12em' }}>
            {t('step_of', { n: step })}
          </p>
          <h1 className="font-display font-bold text-2xl" style={{ color: '#F0E6D3' }}>
            {step === 1 ? t('native_lang_q') : t('target_lang_q')}
          </h1>
          {step === 2 && (
            <p className="mt-1 text-sm" style={{ color: '#4A3F35' }}>
              {LANGUAGES.find((l) => l.code === native)?.flag}{' '}
              {LANGUAGES.find((l) => l.code === native)?.nativeName}
              <span style={{ color: '#2E2820', margin: '0 6px' }}>→</span>
              ?
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {step === 1
            ? LANGUAGES.map((l) => langCard(l, l.code === native, setNative))
            : LANGUAGES.filter((l) => l.code !== native).map((l) => langCard(l, l.code === target, setTarget))}
        </div>

        <button
          onClick={step === 1 ? goToStep2 : confirm}
          className="mt-6 w-full py-4 font-display font-semibold text-base rounded-[8px]"
          style={{ background: '#C8920A', color: '#1A1410' }}>
          {step === 1 ? t('continue') : t('start')}
        </button>
      </main>
    </div>
  )
}
