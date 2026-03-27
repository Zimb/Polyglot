import { supabase } from './supabase'

/**
 * Upsert an array of enriched cards into saved_cards.
 * Each card must have: word, phonetic, translation, example, exampleTranslation,
 *   level, location: { id, name, emoji }, targetLang, savedAt
 */
export async function syncCardsToSupabase(cards, deviceId) {
  if (!deviceId || !cards.length) return

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
 */
export async function fetchCardsFromSupabase(deviceId) {
  if (!deviceId) return []

  const { data, error } = await supabase
    .from('saved_cards')
    .select('*')
    .eq('device_id', deviceId)
    .order('saved_at', { ascending: false })

  if (error) {
    console.error('[fetchCardsFromSupabase]', error.message)
    return []
  }

  return (data ?? []).map((row) => ({
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
}

/**
 * Delete all saved cards for a device.
 */
export async function clearCardsFromSupabase(deviceId) {
  if (!deviceId) return

  const { error } = await supabase
    .from('saved_cards')
    .delete()
    .eq('device_id', deviceId)

  if (error) console.error('[clearCardsFromSupabase]', error.message)
}
