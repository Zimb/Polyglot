// Script/alphabet definitions per target language
// oneBatch: true  = all characters generated in a single API call
// oneBatch: false = multiple batches (large scripts like kanji), batchSize cards per call

export const SCRIPTS = {
  ja: [
    { id: 'hiragana',   label: 'Hiragana',     char: 'あ',  oneBatch: true,  totalCards: 46 },
    { id: 'katakana',   label: 'Katakana',     char: 'ア',  oneBatch: true,  totalCards: 46 },
    { id: 'kanji_n5',   label: 'Kanji N5',     char: '漢', oneBatch: false, batchSize: 20 },
  ],
  ko: [
    { id: 'hangul',     label: '한글',         char: '가', oneBatch: true,  totalCards: 40 },
  ],
  ar: [
    { id: 'arabic',     label: 'الأبجدية',    char: 'ا', oneBatch: true,  totalCards: 28 },
  ],
  ru: [
    { id: 'cyrillic',   label: 'Кириллица',   char: 'А', oneBatch: true,  totalCards: 33 },
  ],
  zh: [
    { id: 'pinyin',     label: 'Pinyin',       char: 'pīn', oneBatch: true,  totalCards: 56 },
    { id: 'hanzi_hsk1', label: 'Hanzi HSK 1',  char: '字', oneBatch: false, batchSize: 20 },
  ],
  hi: [
    { id: 'devanagari', label: 'देवनागरी',   char: 'अ', oneBatch: true,  totalCards: 48 },
  ],
  // Latin-script languages get a pronunciation guide alphabet
  en: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 26 }],
  fr: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 26 }],
  es: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 27 }],
  de: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 30 }],
  it: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 21 }],
  pt: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 26 }],
  nl: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 26 }],
  pl: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 32 }],
  tr: [{ id: 'latin', label: 'Alphabet', char: 'Aa', oneBatch: true, totalCards: 29 }],
}

export function getScripts(langCode) {
  return SCRIPTS[langCode] ?? []
}

export function getScript(langCode, scriptId) {
  return (SCRIPTS[langCode] ?? []).find((s) => s.id === scriptId) ?? null
}
