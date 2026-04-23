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

    hangul: `Generate 20 essential Korean hangul syllable blocks for batch ${sBatch + 1}.
Batch 1 (entries 1–20): consonants ㄱ–ㅎ with vowel ㅏ in order: 가 나 다 라 마 바 사 아 자 차 카 타 파 하 — then start ㅣ series: 기 니 디 리 미 비. Return EXACTLY these 20 in this order.
Batch 2 (entries 21–40): continue ㅣ series: 시 이 지 치 키 티 피 히 — then key compound vowels: 오 우 에 요 유 으 이 외 위 에. Return EXACTLY these 20 in this order.
Batch 3+: additional compound vowels and common blocks in learning order. Return EXACTLY 20 entries.

CRITICAL — Pronunciation philosophy for ALL Hangul cards:
King Sejong designed Hangul so that the SHAPE of each consonant letter literally depicts the position of the articulators (tongue, lips, teeth) when producing that sound. This principle MUST appear concretely in both soundHint and mnemonic for every card:
- soundHint: always describe the EXACT position of the mouth and tongue when pronouncing the consonant (and vowel if notable). Use references a French speaker can feel: "la langue frappe la crête alvéolaire", "le dos de la langue touche le palais mou", "les deux lèvres se ferment". For ㄹ ALWAYS specify it is a flapped/tapped 'r' like Spanish 'pero', NOT the French guttural 'r'. For ㄴ mention the tongue tip at the alveolar ridge. For ㄱ the back of the tongue against the soft palate. For ㅁ/ㅂ the lips pressing together. For ㅎ a light exhaled breath, not a French 'r'. Include a "Ce n'est PAS..." contrasting sentence whenever the sound differs from the nearest French reflex.
- mnemonic: explain how the VISUAL SHAPE of the consonant echoes the articulator position according to Sejong's principle (e.g., ㄴ = angle showing tongue tip at ridge; ㄱ = hook showing tongue raised at back; ㄹ = curved shape showing tongue flapping). Then note vowel direction: vertical line = standing human, horizontal line = flat earth.`,

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

  // ── Per-script field instructions ──────────────────────────────────────────
  // soundHint and mnemonic must be tailored to what actually helps per script type.
  const fieldInstructions = {
    hiragana: {
      soundHint: `"soundHint": ALWAYS write a hint for every kana, in this exact format: "[kana] se prononce '[romanization]' — comme dans '[exampleWord romanization]' ([exampleMeaning])". Example: for し with exampleWord 足(あし): "し se prononce 'shi' — comme dans 'ashi' (pied)". For traps, also add a brief warning: "し se prononce 'shi' (pas 'si') — comme dans 'ashi' (pied)". You must reference the exampleWord you chose — never invent a different word.`,
      mnemonic: `"mnemonic": describe the VISUAL SHAPE of the hiragana stroke as a familiar object or scene. Must derive directly from what the character LOOKS like — NOT wordplay. Example: "あ looks like a person sitting cross-legged with an arm outstretched", "き looks like a key with a vertical shaft and two teeth".`,
    },
    katakana: {
      soundHint: `"soundHint": ALWAYS write a hint for every kana, in this exact format: "[kana] se prononce '[romanization]' — comme dans '[exampleWord romanization]' ([exampleMeaning])". For traps add a warning: "ツ se prononce 'tsu' (pas 'tu') — comme dans 'tsuna' (thon)". You must reference the exampleWord you chose — never invent a different word.`,
      mnemonic: `"mnemonic": describe the VISUAL SHAPE of the katakana stroke as a familiar object. Katakana are angular — use that. Example: "ア looks like an axe blade", "ウ looks like a U-shape with a hat on top".`,
    },
    kanji_n5: {
      soundHint: `"soundHint": list the main readings for this kanji: "On: [on'yomi in katakana] — Kun: [kun'yomi in hiragana]". If only one type exists, omit the other. Keep it concise, max 30 chars.`,
      mnemonic: `"mnemonic": describe the PICTOGRAPHIC ORIGIN or RADICAL COMPOSITION of this kanji in ${sNative}. First identify the visual components (radicals/elements), then explain the logical or pictographic story behind the character. Use well-known mnemonics from Heisig or WaniKani if one exists for this character. Examples: "山: trois pics montagneux vus de face — pictogramme originel d'une montagne", "日: le soleil — un cercle avec une barre horizontale représentant la lumière traversant l'astre", "木: un arbre — le trait vertical est le tronc, les traits du haut sont les branches, ceux du bas les racines", "口: une bouche ouverte vue de face — pictogramme direct". DO NOT invent abstract wordplays — root the mnemonic in what the character visually IS.`,
    },
    hangul: {
      soundHint: `"soundHint": write 2–3 original sentences in ${sNative} for THIS specific syllable block. Structure: (1) name the phonetic category and describe precisely where and how the tongue/lips/throat move, (2) give a concrete analogy from a language the ${sNative} speaker likely knows (Spanish, English, Italian), (3) if the sound differs from the nearest French reflex, add a contrasting "Ce n'est PAS…" warning. Rephrase creatively each time — never repeat the same sentence verbatim across cards.

Phonetic facts per consonant (adapt the wording freely, do NOT copy these sentences word for word):
- ㄹ: alveolar flap — tongue tip briefly taps the ridge behind upper teeth, like Spanish 'r' in "pero" or "pero no". NOT the French guttural 'r' from the throat or the back of the mouth.
- ㄱ: velar unaspirated stop — back of tongue presses soft palate; between 'k' and 'g'. NOT an aspirated English 'k'.
- ㄴ: alveolar nasal — tongue tip at the ridge, like French 'n'. Generally no trap for French speakers.
- ㅎ: light glottal fricative — almost just exhaled air, softer than French 'h'. NOT a guttural sound.
- ㅇ (initial): completely silent; (final): velar nasal 'ng' as in 'song'. NOT a French nasal vowel.
- ㅂ/ㅍ: bilabial — lips together; ㅂ unaspirated (between 'b'/'p'), ㅍ strongly aspirated with air burst.
- ㄷ/ㅌ: dental stop — tongue tip at upper teeth; ㄷ unaspirated, ㅌ aspirated.
- ㅅ: sibilant shifting between 's' and 'sh' depending on following vowel.
- Vowels: ㅏ = open mouth; ㅛ = rounded/protruded lips; ㅡ = unrounded tongue back and mid-high (no French equivalent).`,
      mnemonic: `"mnemonic": write 2 original sentences in ${sNative} specific to THIS exact syllable block. (1) Describe the VISUAL SHAPE of the consonant as a concrete object or body image that connects to the articulator position — Sejong designed each letter to depict the mouth/tongue shape. Use fresh imagery, never repeat the same description across cards. (2) Describe the VISUAL SHAPE of the SPECIFIC VOWEL in this block using its actual graphic form — do NOT write a generic phrase like "voyelle verticale = personnage debout". Instead, describe what this particular vowel stroke looks like as a concrete image (e.g. ㅏ = a vertical mast with a short sail jutting right; ㅣ = a single upright stroke like a standing rod; ㅡ = a flat horizon line; ㅗ = a vertical rising from the earth; ㅜ = a peg hanging down; ㅛ = two rising pegs side by side).

Shape facts per consonant (rephrase creatively, do NOT copy verbatim):
- ㄹ: curved/scrolled shape evoking a tongue that curls and flaps against the alveolar ridge.
- ㄴ: right-angle shape showing the tongue tip pressing the ridge then dropping away.
- ㄱ: hook shape showing the tongue arched toward the back of the soft palate.
- ㅁ: closed square — both lips fully sealed together (bilabial closure).
- ㅂ: open square with outward strokes — lips open with an expelled burst of air.
- ㅅ: two strokes meeting at a point like a forked tongue or an open mouth from the front.
- ㅇ: empty circle — open throat with no obstruction (silent initial) or round resonating cavity ('ng').

Vowel visual shapes to use as reference (describe the specific one in this card):
- ㅏ: vertical line with a short horizontal branch pointing right — like a flagpole with a flag
- ㅣ: single vertical stroke — a simple upright rod or needle
- ㅡ: single flat horizontal line — a calm horizon or a closed eyelid
- ㅗ: horizontal base with a vertical rising from the center — like a T or a plant sprouting
- ㅜ: horizontal top with a vertical hanging down — like a hook or a hanging peg
- ㅛ: horizontal line with two short verticals rising — like two seedlings sprouting side by side
- ㅠ: horizontal line with two short verticals hanging down — like two drops falling
- ㅐ: vertical with a branch right and another stroke — two parallel verticals linked
- ㅔ: similar to ㅐ but slightly different spacing — two close uprights`,
    },
    arabic: {
      soundHint: `"soundHint": one sentence in ${sNative} explaining how to produce this sound — mouth/throat position if unusual (guttural, pharyngeal, etc.).`,
      mnemonic: `"mnemonic": describe the VISUAL SHAPE of this letter's isolated form, then note the number of dots (if any) as the key distinguishing feature. Example: "ب looks like a boat with one dot below; ت is the same boat with two dots above".`,
    },
    cyrillic: {
      soundHint: `"soundHint": compare to a Latin letter or a familiar sound for a ${sNative} speaker. Note any traps (Р = R not P, Н = N not H, etc.).`,
      mnemonic: `"mnemonic": if the letter looks like a Latin letter but sounds different, flag it as a "faux ami" trap. Otherwise describe the shape. Example: "Р ressemble à un P latin mais se prononce R — piège classique".`,
    },
    devanagari: {
      soundHint: `"soundHint": describe the articulation point (velar, palatal, retroflex, dental, labial) and whether it is aspirated or not.`,
      mnemonic: `"mnemonic": identify a recognizable sub-shape or stroke pattern in the character and link it to a visual image. Reference the top horizontal line (शिरोरेखा) as the unifying feature.`,
    },
    pinyin: {
      soundHint: `"soundHint": one sentence in ${sNative} explaining the exact pronunciation — mouth shape, tongue position, tone pattern.`,
      mnemonic: `"mnemonic": for tones, describe the tone contour as a visual curve. For unusual initials (zh/ch/sh/r/x/q), compare to the nearest ${sNative} sound and flag the difference.`,
    },
    hanzi_hsk1: {
      soundHint: `"soundHint": "Pinyin: [pinyin with tone mark] — Ton [1-4 ou neutre]". Keep it short.`,
      mnemonic: `"mnemonic": describe the PICTOGRAPHIC ORIGIN or component radicals, exactly like for kanji. Use established mnemonics from known systems (Heisig, Remembering Traditional Hanzi) when they exist. Example: "人: une personne vue de côté en train de marcher — deux traits formant les jambes écartées", "山: trois pics de montagne", "口: une bouche ouverte". Ground the mnemonic in the character's visual structure.`,
    },
    latin: {
      soundHint: `"soundHint": highlight ONLY letters whose pronunciation differs from ${sNative}. For letters that sound the same, write "Comme en ${sNative}."`,
      mnemonic: `"mnemonic": only needed for letters with unusual pronunciation or diacritics. For standard letters: write "Standard — pas de piège."`,
    },
  }

  const fi = fieldInstructions[sScript] ?? {
    soundHint: `"soundHint": one concise sentence in ${sNative} explaining how to pronounce this character for a ${sNative} speaker.`,
    mnemonic: `"mnemonic": one visual mnemonic in ${sNative} based on the character's shape (1 sentence).`,
  }

  const systemPrompt = `You are an expert linguist and visual memory specialist creating script learning cards. You ground every mnemonic in the character's actual visual form, radical composition, or pictographic origin — never in abstract wordplay. You reference established mnemonic systems (Heisig, WaniKani, etc.) when applicable. Return only valid JSON arrays.`

  const nonce = Math.random().toString(36).slice(2, 8)
  const userPrompt = `[session:${nonce}] Create ${sScript} script learning flashcards for a ${sNative} speaker learning ${sTarget}.

${instruction}

For EACH character, return a JSON object with EXACTLY these keys:
- "character": the character/letter itself (e.g. "あ", "А", "ا", "A a")
- "romanization": how to read/pronounce it in latin script (short, max 10 chars, e.g. "a", "ka", "alif")
- "word": same value as "character" (required for game compatibility)
- "translation": for alphabet/syllabary = same as romanization; for kanji/hanzi = primary meaning in ${sNative}
- "exampleWord": a short, well-known word in ${sTarget} that contains or starts with this character. For hiragana/katakana: write the word fully in kana (no kanji), so the learner can see the character in context — e.g. for し: "あし" not "足". For kanji/hanzi, prefer a compound that clearly illustrates the kanji's core meaning (e.g. 山 → 富士山, 日 → 日本, 水 → 水道). For kana with a pronunciation trap, choose a word that makes the trap audible and that the soundHint can reference directly.
- "exampleRomanization": romanization of the example word
- "exampleMeaning": meaning of the example word in ${sNative}
- ${fi.soundHint}
- ${fi.mnemonic}

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
        temperature: 0.85,
        max_tokens: 16000,
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      console.error('OpenRouter error:', err)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await resp.json()
    const raw = data.choices?.[0]?.message?.content ?? ''

    // Robust JSON extraction: strip markdown fences, then find the outermost array
    let jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const arrayStart = jsonStr.indexOf('[')
    const arrayEnd = jsonStr.lastIndexOf(']')
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1)
    }

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
