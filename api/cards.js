/**
 * POST /api/cards
 * Standard mode: browse the global card pool without calling the AI.
 *
 * Body: { targetLang, nativeLang, level, locationId, seenWords, newCount }
 * Returns: { cards: [...], totalAvailable: number }
 *
 * - Cards are filtered to exclude words in `seenWords` (this-session dedup).
 * - Returns up to `newCount` shuffled cards (default 8).
 * - `totalAvailable` tells the client how many unseen cards exist for context.
 */
import { supabaseAnon } from '../lib/supabase-server.js'

const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { targetLang, nativeLang, level, locationId, seenWords, newCount } = req.body ?? {}

  if (!targetLang || !nativeLang || !level || !locationId) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const safe = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 100)
  const sTarget   = safe(targetLang)
  const sNative   = safe(nativeLang)
  const sLevel    = safe(level)
  const sLocation = safe(locationId)
  const count     = Math.max(1, Math.min(8, Number.isInteger(newCount) ? newCount : 8))

  if (!ALLOWED_LEVELS.includes(sLevel)) {
    return res.status(400).json({ error: 'Invalid level' })
  }

  if (!supabaseAnon) {
    return res.status(503).json({ error: 'Database not configured — set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' })
  }

  // Sanitize seenWords (client-provided, cap size to prevent abuse)
  const seenSet = new Set(
    Array.isArray(seenWords)
      ? seenWords.slice(0, 300).map((w) => String(w).slice(0, 200))
      : []
  )

  try {
    // Fetch up to 300 candidates for this lang/level/location combo
    const { data, error } = await supabaseAnon
      .from('global_cards')
      .select('word, phonetic, translation, example, example_translation')
      .eq('target_lang', sTarget)
      .eq('native_lang', sNative)
      .eq('level', sLevel)
      .eq('location_id', sLocation)
      .order('generated_count', { ascending: false })
      .limit(300)

    if (error) {
      console.error('[api/cards] DB error:', error.message)
      return res.status(500).json({ error: 'Database error' })
    }

    // Exclude already-seen words for this session
    const unseen = (data ?? []).filter((c) => !seenSet.has(c.word))
    const totalAvailable = unseen.length

    if (totalAvailable === 0) {
      return res.status(200).json({ cards: [], totalAvailable: 0 })
    }

    // Shuffle and take the requested count
    const shuffled = [...unseen].sort(() => Math.random() - 0.5).slice(0, count)

    const cards = shuffled.map((row) => ({
      word:               row.word,
      phonetic:           row.phonetic ?? null,
      translation:        row.translation,
      example:            row.example ?? null,
      exampleTranslation: row.example_translation ?? null,
    }))

    return res.status(200).json({ cards, totalAvailable })
  } catch (err) {
    console.error('[api/cards] Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
