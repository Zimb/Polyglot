/**
 * POST /api/adventure-dialogue
 * Body: { targetLang, nativeLang, level, location, words }
 * words = array of 5 target-language words/phrases that MUST appear as blanks
 * Returns: { lines: [{ speaker, text, translation, blankWords }], wordBank }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { targetLang, nativeLang, level, location, words } = req.body ?? {}
  if (!targetLang || !nativeLang || !level || !location || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const safe = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 120)
  const sTarget = safe(targetLang)
  const sNative = safe(nativeLang)
  const sLevel  = safe(level)
  const sLoc    = safe(location)
  const sWords  = words.slice(0, 8).map(w => safe(w))

  const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced']
  if (!ALLOWED_LEVELS.includes(sLevel)) return res.status(400).json({ error: 'Invalid level' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured' })

  const prompt = `You are creating a fill-in-the-blank language exercise in ${sTarget}.
Setting: a dialogue at a "${sLoc}" in a ${sTarget}-speaking location.
Native language for translations: ${sNative}. Level: ${sLevel}.
Two speakers: A (visitor/customer) and B (staff/local). Alternate strictly: A, B, A, B, A, B (6 lines).

MANDATORY CONSTRAINT: You MUST use EXACTLY these words/phrases as blanks (replaced by ___ in "text"):
${sWords.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Each of these words must appear as a blank EXACTLY ONCE across all 6 lines.
If a word has more than one word (e.g. a phrase), it counts as ONE blank (one ___).
You may add at most 1 extra blank using a common word NOT in this list.

Return ONLY valid JSON with NO markdown fences:
{
  "lines": [
    {
      "speaker": "A",
      "text": "Full sentence in ${sTarget} with ___ replacing each blank",
      "translation": "Sentence translated into ${sNative}",
      "blankWords": ["exact_word_hidden_by_first___"]
    }
  ],
  "wordBank": [${sWords.map(w => `"${w}"`).join(', ')}, "distractor1", "distractor2", "distractor3"]
}

Rules:
- blankWords[i] = exact word/phrase hidden by the i-th ___ in text (same form, same case)
- wordBank = all blankWords from all lines + exactly 3 distractors (unique ${sTarget} words, no duplicates)
- All dialogue lines in ${sTarget}, all translations in ${sNative}
- Make the dialogue realistic and natural for a "${sLoc}"`

  try {
    const apiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.65,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!apiRes.ok) {
      const text = await apiRes.text()
      return res.status(502).json({ error: 'AI API error', detail: text.slice(0, 200) })
    }

    const data = await apiRes.json()
    const raw = data.choices?.[0]?.message?.content ?? ''
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(clean)

    if (!Array.isArray(parsed.lines) || parsed.lines.length === 0 || !Array.isArray(parsed.wordBank)) {
      return res.status(502).json({ error: 'Invalid AI response structure' })
    }

    return res.json(parsed)
  } catch (err) {
    return res.status(500).json({ error: 'Server error', detail: err.message })
  }
}
