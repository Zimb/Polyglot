/**
 * POST /api/alphabet
 * Body: { targetLang, nativeLang, scriptId, batchIndex? }
 * Returns: { cards: [{character, romanization, word, translation, soundHint, mnemonic,
 *                     exampleWord, exampleRomanization, exampleMeaning}] }
 *
 * Cards are always returned in the canonical script order (gojuuon for hiragana, etc.)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { targetLang, nativeLang, scriptId, batchIndex = 0 } = req.body ?? {}

  if (!targetLang || !nativeLang || !scriptId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const safe = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80)
  const sTarget = safe(targetLang)
  const sNative = safe(nativeLang)
  const sScript = safe(scriptId)
  const sBatch = Math.max(0, Math.min(50, parseInt(batchIndex) || 0))

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  // ── Ordering instructions per script ───────────────────────────────────────
  const scriptInstructions = {
    hiragana: `Generate ALL 46 hiragana characters in STRICT gojuuon order:
Row あ: あ い う え お
Row か: か き く け こ
Row さ: さ し す せ そ
Row た: た ち つ て と
Row な: な に ぬ ね の
Row は: は ひ ふ へ ほ
Row ま: ま み む め も
Row や: や ゆ よ
Row ら: ら り る れ ろ
Row わ: わ を ん
Return EXACTLY 46 cards in this exact order. Do not add dakuten variants.`,

    katakana: `Generate ALL 46 katakana characters in STRICT gojuuon order:
Row ア: ア イ ウ エ オ
Row カ: カ キ ク ケ コ
Row サ: サ シ ス セ ソ
Row タ: タ チ ツ テ ト
Row ナ: ナ ニ ヌ ネ ノ
Row ハ: ハ ヒ フ ヘ ホ
Row マ: マ ミ ム メ モ
Row ヤ: ヤ ユ ヨ
Row ラ: ラ リ ル レ ロ
Row ワ: ワ ヲ ン
Return EXACTLY 46 cards in this exact order.`,

    kanji_n5: `Generate 20 essential JLPT N5 kanji for batch ${sBatch + 1} (characters ${sBatch * 20 + 1}–${(sBatch + 1) * 20}).
Batch 1 must be these 20 in order: 一 二 三 四 五 六 七 八 九 十 百 千 万 円 日 月 火 水 木 金
Batch 2 continues with the next 20 most important N5 kanji by frequency: 土 山 川 田 人 口 手 目 耳 足 力 小 大 中 上 下 左 右 前 後
Batch 3+: continue N5 kanji in importance order.
Each kanji must be unique within the batch.
Return EXACTLY 20 kanji.`,

    hangul: `Generate 40 essential Korean hangul syllable blocks in canonical learning order.
Start with basic consonant ㄱ through ㅎ each combined with vowel ㅏ: 가 나 다 라 마 바 사 아 자 차 카 타 파 하
Then the same consonants with ㅣ: 기 니 디 리 미 비 시 이 지 치 키 티 피 히
Then add: 오 우 에 외 위 (key compound vowels).
Return EXACTLY 40 entries in this order.`,

    arabic: `Generate ALL 28 Arabic alphabet letters in traditional alphabetical order:
ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي
Return EXACTLY 28 cards in this exact order. For each letter include its isolated form.`,

    cyrillic: `Generate ALL 33 Russian Cyrillic letters in strict alphabetical order:
А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я
Return EXACTLY 33 cards in this exact order.`,

    devanagari: `Generate Hindi Devanagari script characters in traditional order:
First 12 vowels (svar): अ आ इ ई उ ऊ ए ऐ ओ औ अं अः
Then 34 consonants (vyanjan) in groups:
  क ख ग घ ङ (velar)
  च छ ज झ ञ (palatal)
  ट ठ ड ढ ण (retroflex)
  त थ द ध न (dental)
  प फ ब भ म (labial)
  य र ल व श ष स ह (semi-vowels & sibilants)
Return approximately 48 entries in this exact order.`,

    pinyin: `Generate Chinese Pinyin covering all key initials paired with their most natural finals, in learning order:
bō pō mō fō / dé tè nè lè / gē kē hē / jī qī xī / zhī chī shī rī / zī cī sī /
Then key standalone finals: ā á ǎ à / ē é ě è / yī yí yǐ yì / wū wú wǔ wù / ǖ ǘ ǚ ǜ
Return 56 representative Pinyin syllables in this order.`,

    hanzi_hsk1: `Generate 20 Chinese characters for batch ${sBatch + 1} (items ${sBatch * 20 + 1}–${(sBatch + 1) * 20}).
Batch 1 — most essential HSK 1: 一 二 三 四 五 六 七 八 九 十 零 百 千 万 人 我 你 他 她 是
Batch 2 — HSK 1 continued: 的 了 在 有 不 这 个 们 来 去 说 大 小 国 学 生 先 好 什 么
Batch 3+: continue with high-frequency HSK 1-2 characters in importance order.
Return EXACTLY 20 characters.`,

    latin: `Generate the complete ${sTarget}-language alphabet pronunciation guide in strict A-Z order.
Include all letters of this language's alphabet, including language-specific letters in their correct position
(e.g. ñ for Spanish after n; ü ö ä for German; ij for Dutch; ś ą ź etc for Polish).
For each letter: use the uppercase+lowercase pair as the "character" (e.g. "A a").
Return all letters in strict alphabetical order.`,
  }

  const instruction = scriptInstructions[sScript]
  if (!instruction) return res.status(400).json({ error: `Unknown script: ${sScript}` })

  const systemPrompt = `You are an expert linguist creating alphabet learning cards. You provide precise, ordered script content with helpful mnemonics and pronunciation guides. Return only valid JSON arrays.`

  const userPrompt = `Create ${sScript} script learning flashcards for a ${sNative} speaker learning ${sTarget}.

${instruction}

For EACH character, return a JSON object with EXACTLY these keys:
- "character": the character/letter itself (e.g. "あ", "А", "ا", "A a")
- "romanization": how to read/pronounce it in latin script (short, max 10 chars, e.g. "a", "ka", "alif")
- "word": same value as "character" (required for game compatibility)
- "translation": for alphabet/syllabary = same as romanization; for kanji/hanzi = primary meaning in ${sNative}
- "soundHint": one concise sentence in ${sNative} explaining how to pronounce this character for a ${sNative} speaker (e.g. for French speaker: "Comme 'ah' dans 'pâte'")
- "mnemonic": one creative, memorable visual mnemonic written in ${sNative} to remember this character (1 sentence)
- "exampleWord": a simple recognizable word in ${sTarget} using or starting with this character
- "exampleRomanization": romanization of the example word
- "exampleMeaning": meaning of the example word in ${sNative}

IMPORTANT: Return ONLY a valid JSON array. No markdown fences, no explanation text, no comments.`

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://polyglot.vercel.app',
        'X-Title': 'Polyglot',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 6000,
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      console.error('OpenRouter error:', err)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await resp.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()

    let cards
    try {
      cards = JSON.parse(jsonStr)
    } catch {
      console.error('Alphabet parse error, raw:', raw)
      return res.status(502).json({ error: 'Failed to parse AI response' })
    }

    if (!Array.isArray(cards)) {
      return res.status(502).json({ error: 'Unexpected response format' })
    }

    return res.status(200).json({ cards })
  } catch (err) {
    console.error('Alphabet handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
