/**
 * Server-side Supabase clients — import ONLY from /api/* handlers.
 * Never import this in browser code (src/).
 *
 * Required env vars (add to .env.local and Vercel project settings):
 *   VITE_SUPABASE_URL          — same project URL as the client
 *   VITE_SUPABASE_ANON_KEY     — anon/public key (already set)
 *   SUPABASE_SERVICE_ROLE_KEY  — service role key (never expose to browser!)
 *     → Supabase dashboard → Project Settings → API → service_role key
 */
import { createClient } from '@supabase/supabase-js'

const url    = process.env.VITE_SUPABASE_URL
const anon   = process.env.VITE_SUPABASE_ANON_KEY
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const opts = { auth: { persistSession: false, autoRefreshToken: false } }

/**
 * Admin client — bypasses Row Level Security.
 * Use for server-side writes (e.g. upserting into global_cards).
 * null when SUPABASE_SERVICE_ROLE_KEY is not configured.
 */
export const supabaseAdmin = (url && svcKey)
  ? createClient(url, svcKey, opts)
  : null

/**
 * Anon client — respects RLS, for server-side read-only queries.
 * Use for browsing global_cards in standard mode.
 */
export const supabaseAnon = (url && anon)
  ? createClient(url, anon, opts)
  : null
