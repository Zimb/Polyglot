const TTS_LANG = {
  en:'en-US', fr:'fr-FR', es:'es-ES', de:'de-DE', it:'it-IT', pt:'pt-PT',
  ja:'ja-JP', zh:'zh-CN', ar:'ar-SA', ru:'ru-RU', ko:'ko-KR', nl:'nl-NL',
  pl:'pl-PL', tr:'tr-TR', hi:'hi-IN', sv:'sv-SE', no:'nb-NO', da:'da-DK',
  fi:'fi-FI', el:'el-GR', he:'he-IL', uk:'uk-UA', cs:'cs-CZ', ro:'ro-RO',
  hu:'hu-HU', vi:'vi-VN', th:'th-TH', id:'id-ID',
}

let voicesReady = false
let cachedVoices = []

function loadVoices() {
  cachedVoices = window.speechSynthesis?.getVoices() ?? []
  if (cachedVoices.length > 0) voicesReady = true
}

// Chrome loads voices asynchronously
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

function findVoice(bcp47) {
  if (!cachedVoices.length) loadVoices()
  const lang = bcp47.toLowerCase()
  const prefix = lang.split('-')[0]
  // Exact match first, then prefix match, prefer non-local/network voices
  return cachedVoices.find(v => v.lang.toLowerCase() === lang)
    || cachedVoices.find(v => v.lang.toLowerCase().startsWith(prefix + '-'))
    || cachedVoices.find(v => v.lang.toLowerCase() === prefix)
    || null
}

export function speak(text, langCode) {
  const synth = window.speechSynthesis
  if (!synth) return

  synth.cancel()

  const bcp47 = TTS_LANG[langCode] || langCode
  const u = new SpeechSynthesisUtterance(text)
  u.lang = bcp47
  u.rate = 0.85

  const voice = findVoice(bcp47)
  if (voice) u.voice = voice

  synth.speak(u)
}
