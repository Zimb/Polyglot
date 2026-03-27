/**
 * useLocations — returns the list of active locations.
 * Immediately returns the hardcoded LOCATIONS fallback, then
 * replaces with database rows once the Supabase fetch resolves.
 * This means the UI is never blocked, and new locations added in
 * Supabase automatically appear without a code deploy.
 */
import { useState, useEffect } from 'react'
import { LOCATIONS } from './languages'
import { supabase } from './supabase'

let _cache = null  // module-level cache so all components share one fetch

export default function useLocations() {
  const [locations, setLocations] = useState(_cache ?? LOCATIONS)

  useEffect(() => {
    if (_cache) return  // already fetched this session

    supabase
      .from('locations')
      .select('slug, name, emoji, description')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) return  // silently keep fallback
        const mapped = data.map((row) => ({
          id:    row.slug,
          name:  row.name,
          emoji: row.emoji,
          desc:  row.description ?? '',
        }))
        _cache = mapped
        setLocations(mapped)
      })
  }, [])

  return locations
}
