/**
 * POST /api/flashcard
 * Body: { targetLang, nativeLang, level, theme }
 * Returns: { cards: [{ word, phonetic, translation, example, exampleTranslation }] }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { targetLang, nativeLang, level, theme } = req.body ?? {}

  if (!targetLang || !nativeLang || !level || !theme) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Basic input sanitization — strip control characters and limit length
  const safe = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80)
  const sTargetLang = safe(targetLang)
  const sNativeLang = safe(nativeLang)
  const sLevel = safe(level)
  const sTheme = safe(theme)

  const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced']
  if (!ALLOWED_LEVELS.includes(sLevel)) {
    return res.status(400).json({ error: 'Invalid level' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' })
  }

  const prompt = `You are a language teacher creating flashcards.
The student's native language is "${sNativeLang}" and they are learning "${sTargetLang}" at the "${sLevel}" level.
Theme: "${sTheme}"

Generate exactly 8 flashcard entries related to this theme. 
Respond ONLY with a valid JSON array — no markdown, no explanation.
Each object must have these exact keys:
  "word"               — the word or short phrase in ${sTargetLang}
  "phonetic"           — pronunciation guide in latin characters (skip if same script as latin)
  "translation"        — the translation in ${sNativeLang}
  "example"            — a short example sentence in ${sTargetLang} using the word
  "exampleTranslation" — translation of the example sentence in ${sNativeLang}

Example format:
[
  {
    "word": "bonjour",
    "phonetic": "bon-ZHOOR",
    "translation": "hello",
    "example": "Bonjour, comment allez-vous ?",
    "exampleTranslation": "Hello, how are you?"
  }
]`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://polyglot.vercel.app',
        'X-Title': 'Polyglot',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenRouter error:', err)
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ''

    // Strip possible markdown fences
    const jsonString = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim()

    let cards
    try {
      cards = JSON.parse(jsonString)
    } catch {
      console.error('JSON parse error, raw:', raw)
      return res.status(502).json({ error: 'Failed to parse AI response' })
    }

    if (!Array.isArray(cards)) {
      return res.status(502).json({ error: 'Unexpected AI response format' })
    }

    return res.status(200).json({ cards })
  } catch (err) {
    console.error('Flashcard handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
