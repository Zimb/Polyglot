import { supabase } from './supabase'

// Module-level TTL cache: avoids refetching saved cards on every navigation
// { [deviceId]: { data: Card[], ts: number } }
const _fetchCache = {}
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Upsert an array of enriched cards into saved_cards.
 * Each card must have: word, phonetic, translation, example, exampleTranslation,
 *   level, location: { id, name, emoji }, targetLang, savedAt
 */
export async function syncCardsToSupabase(cards, deviceId) {
  if (!deviceId || !cards.length) return
  delete _fetchCache[deviceId] // invalidate so next fetch gets fresh data

  const rows = cards.map((c) => ({
    device_id:           deviceId,
    word:                c.word,
    phonetic:            c.phonetic ?? null,
    translation:         c.translation,
    example:             c.example ?? null,
    example_translation: c.exampleTranslation ?? null,
    level:               c.level,
    location_id:         c.location?.id ?? null,
    location_name:       c.location?.name ?? null,
    location_emoji:      c.location?.emoji ?? null,
    target_lang:         c.targetLang,
    saved_at:            c.savedAt ?? new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('saved_cards')
    .upsert(rows, { onConflict: 'device_id,word,target_lang,level', ignoreDuplicates: true })

  if (error) console.error('[syncCardsToSupabase]', error.message)
}

/**
 * Fetch all saved cards for a device, ordered by saved_at desc.
 * Returns an array of enriched card objects (matching the local store shape).
 * Results are cached for 5 minutes to avoid redundant DB calls on navigation.
 */
export async function fetchCardsFromSupabase(deviceId) {
  if (!deviceId) return []

  const cached = _fetchCache[deviceId]
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data

  const { data, error } = await supabase
    .from('saved_cards')
    .select('*')
    .eq('device_id', deviceId)
    .order('saved_at', { ascending: false })

  if (error) {
    console.error('[fetchCardsFromSupabase]', error.message)
    return []
  }

  const result = (data ?? []).map((row) => ({
    word:               row.word,
    phonetic:           row.phonetic,
    translation:        row.translation,
    example:            row.example,
    exampleTranslation: row.example_translation,
    level:              row.level,
    location:           row.location_id
      ? { id: row.location_id, name: row.location_name, emoji: row.location_emoji }
      : null,
    targetLang: row.target_lang,
    savedAt:    row.saved_at,
  }))
  _fetchCache[deviceId] = { data: result, ts: Date.now() }
  return result
}

/**
 * Delete all saved cards for a device.
 */
export async function clearCardsFromSupabase(deviceId) {
  if (!deviceId) return
  delete _fetchCache[deviceId]

  const { error } = await supabase
    .from('saved_cards')
    .delete()
    .eq('device_id', deviceId)

  if (error) console.error('[clearCardsFromSupabase]', error.message)
}

// ─── Alphabet cards sync ──────────────────────────────────────────────────────

/**
 * Upsert alphabet/script cards for a given (device, lang, script) triple.
 * Replaces the stored array entirely — call after setAlphabetCards or addAlphabetCards.
 */
export async function syncAlphabetCardsToSupabase(deviceId, targetLang, scriptId, cards) {
  if (!deviceId || !cards.length) return

  const { error } = await supabase
    .from('alphabet_cards')
    .upsert(
      { device_id: deviceId, target_lang: targetLang, script_id: scriptId, cards, updated_at: new Date().toISOString() },
      { onConflict: 'device_id,target_lang,script_id' }
    )

  if (error) console.error('[syncAlphabetCardsToSupabase]', error.message)
}

/**
 * Fetch all alphabet card sets for a device.
 * Returns an object mapping `${targetLang}_${scriptId}` → cards[].
 */
export async function fetchAlphabetCardsFromSupabase(deviceId) {
  if (!deviceId) return {}

  const { data, error } = await supabase
    .from('alphabet_cards')
    .select('target_lang, script_id, cards')
    .eq('device_id', deviceId)

  if (error) {
    console.error('[fetchAlphabetCardsFromSupabase]', error.message)
    return {}
  }

  const result = {}
  for (const row of data ?? []) {
    result[`${row.target_lang}_${row.script_id}`] = row.cards ?? []
  }
  return result
}
