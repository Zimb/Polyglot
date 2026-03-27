export const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'French',     flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸', nativeName: 'Español' },
  { code: 'de', name: 'German',     flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian',    flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷', nativeName: '한국어' },
  { code: 'nl', name: 'Dutch',      flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish',     flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish',    flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳', nativeName: 'हिन्दी' },
]

export const FLASHCARD_THEMES = [
  'greetings & basics',
  'numbers & counting',
  'colors & shapes',
  'food & drinks',
  'family & relationships',
  'body parts',
  'days & months',
  'weather & nature',
  'travel & transport',
  'shopping & money',
  'work & professions',
  'health & medicine',
  'emotions & feelings',
  'home & furniture',
  'animals',
  'sports & hobbies',
  'technology',
  'time & schedule',
]

export function getLang(code) {
  return LANGUAGES.find((l) => l.code === code)
}
