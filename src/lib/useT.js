import { useMemo } from 'react'
import useAppStore from '../store/useAppStore'
import { getT, detectBrowserLang } from './i18n'

/**
 * Returns a translation function `t(key, vars?)` for the user's native language.
 * Falls back to browser language, then English, if nativeLang is not set.
 */
export default function useT() {
  const nativeLang = useAppStore((s) => s.nativeLang)
  const lang = nativeLang ?? detectBrowserLang()
  return useMemo(() => getT(lang), [lang])
}
