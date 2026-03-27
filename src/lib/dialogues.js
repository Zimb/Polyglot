/**
 * Supabase helpers for saved_dialogues table persistence.
 * 
 * Sync direction:
 * - On save: local Zustand store → Supabase DB (via syncDialogueToSupabase)
 * - On mount: Supabase DB → local store (via fetchDialoguesFromSupabase + mergeSavedDialogues)
 * 
 * Error handling: Silent fallback to local store on any DB error.
 */
import { supabase } from './supabase'
import { LOCATIONS } from './languages'

/**
 * POST to saved_dialogues: persist one completed dialogue to Supabase.
 * Called after user completes a dialogue in Discovery or Adventure mode.
 * 
 * Args:
 *   dialogue: { targetLang, nativeLang, level, location: { id }, lines, wordBank, savedAt? }
 *   deviceId: unique device identifier (Zustand store.deviceId)
 * 
 * Behavior:
 * - Validates deviceId and location.id exist
 * - Generates saved_at timestamp if not provided
 * - Silently fails on error (local store is always the source of truth)
 */
export async function syncDialogueToSupabase(dialogue, deviceId) {
  if (!deviceId || !dialogue?.location?.id) return
  const { error } = await supabase.from('saved_dialogues').insert({
    device_id:   deviceId,
    target_lang: dialogue.targetLang,
    native_lang: dialogue.nativeLang,
    level:       dialogue.level,
    location_id: dialogue.location.id,
    lines:       dialogue.lines    ?? [],
    word_bank:   dialogue.wordBank ?? [],
    saved_at:    dialogue.savedAt
      ? new Date(dialogue.savedAt).toISOString()
      : new Date().toISOString(),
  })
  if (error) console.error('[syncDialogueToSupabase]', error.message)
}

/**
 * SELECT from saved_dialogues: hydrate local store with user's saved dialogues.
 * Called on FillBlank mount to enable Library mode (replay of completed dialogues).
 * 
 * Args:
 *   deviceId: unique device identifier (Zustand store.deviceId)
 * 
 * Returns:
 *   Array of dialogues in Zustand store shape: 
 *   [{ targetLang, nativeLang, level, location: { id, name, emoji, desc }, lines, wordBank, savedAt }, ...]
 *   Returns [] on error or if deviceId is falsy (graceful degradation).
 * 
 * Behavior:
 * - Filters by device_id to ensure user privacy
 * - Ordered by saved_at DESC (newest first)
 * - Maps DB snake_case columns to store camelCase keys
 * - Enriches location with name, emoji, desc from LOCATIONS hardcoded list
 */
export async function fetchDialoguesFromSupabase(deviceId) {
  if (!deviceId) return []
  const { data, error } = await supabase
    .from('saved_dialogues')
    .select('target_lang, native_lang, level, location_id, lines, word_bank, saved_at')
    .eq('device_id', deviceId)
    .order('saved_at', { ascending: false })
  if (error) {
    console.error('[fetchDialoguesFromSupabase]', error.message)
    return []
  }
  return (data ?? []).map((row) => {
    const fullLocation = LOCATIONS.find((loc) => loc.id === row.location_id) || { id: row.location_id }
    return {
      targetLang: row.target_lang,
      nativeLang: row.native_lang,
      level:      row.level,
      location:   fullLocation,
      lines:      row.lines    ?? [],
      wordBank:   row.word_bank ?? [],
      savedAt:    new Date(row.saved_at).getTime(),
    }
  })
}
