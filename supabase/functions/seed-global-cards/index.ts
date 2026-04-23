/**
 * supabase/functions/seed-global-cards/index.ts
 *
 * Supabase Edge Function (Deno) — Remplit automatiquement la table `global_cards`
 * avec des flashcards générées via OpenRouter.
 *
 * Déclenchement :
 *   - Automatique : cron configuré dans le dashboard Supabase (ex: "0 *\/6 * * *")
 *   - Manuel : POST https://<project>.supabase.co/functions/v1/seed-global-cards
 *              Header: Authorization: Bearer <CRON_SECRET>
 *              Body (optionnel, pour cibler un combo précis) :
 *                { "target": "Japanese", "native": "French", "location": "Restaurant", "level": "beginner" }
 *
 * Variables Supabase Secrets requises (supabase secrets set KEY=value) :
 *   OPENROUTER_API_KEY
 *   CRON_SECRET           (secret arbitraire pour appels manuels sécurisés)
 *   SUPABASE_URL          (injecté automatiquement par Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY (injecté automatiquement par Supabase)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

// ── Clients ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ── Paires de langues prioritaires ───────────────────────────────────────────
// Ajouter/retirer selon les langues disponibles dans l'app.
const LANG_PAIRS: Array<{ target: string; native: string }> = [
  { target: 'Spanish',    native: 'French' },
  { target: 'English',    native: 'French' },
  { target: 'Japanese',   native: 'French' },
  { target: 'German',     native: 'French' },
  { target: 'Italian',    native: 'French' },
  { target: 'Portuguese', native: 'French' },
  { target: 'Chinese',    native: 'French' },
  { target: 'Arabic',     native: 'French' },
  { target: 'Korean',     native: 'French' },
  { target: 'Russian',    native: 'French' },
  { target: 'Spanish',    native: 'English' },
  { target: 'French',     native: 'English' },
  { target: 'Japanese',   native: 'English' },
  { target: 'German',     native: 'English' },
  { target: 'Italian',    native: 'English' },
]

const LOCATIONS: string[] = [
  'Restaurant',
  'Café / Brasserie',
  'Musée',
  'Parc',
  "Parc d'attractions",
  'Supermarché',
  'Marché',
  'Gare / Aéroport',
  'Hôtel',
  'Chez le médecin',
  'Pharmacie',
  'Plage',
  'Cinéma / Théâtre',
  'Dans la rue',
  'Bureau / Travail',
  'Université / École',
]

const LEVELS: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
]

// Par invocation : 4 combos × 8 cartes = 32 cartes max (reste < 60 s de timeout)
const BATCH_SIZE = 4
const CARDS_PER_COMBO = 8
// Un combo avec >= MIN_THRESHOLD cartes est considéré suffisamment rempli.
const MIN_THRESHOLD = 16

// ── Prompts ───────────────────────────────────────────────────────────────────
const CONTENT_GUIDE: Record<string, string> = {
  beginner:     `Each "word" = a single noun, verb, or common object found at this location. Each "example" = a very short sentence (3–6 words) placing that word in context at this specific location.`,
  intermediate: `Each "word" = a natural phrase or sentence someone would say at this location (4–9 words). Each "example" = a follow-up sentence or response that continues the conversation at this location.`,
  advanced:     `Each "word" = a natural question someone asks at this location. Each "example" = a realistic, natural answer to that exact question.`,
}

const DOMAIN_HINTS: Record<string, string> = {
  'Restaurant':           'Cover: greetings on arrival, asking for a table, reading the menu, ordering starters/mains/desserts/drinks, allergens, specials, cooking methods, condiments, bill, complimenting food, tipping.',
  'Café / Brasserie':     'Cover: ordering coffee/tea/pastries, wifi, receipt, working at a café, small talk, breakfast items, paying at the counter.',
  'Musée':                'Cover: buying tickets, audio guides, exhibit labels, guided tour, opening hours, artwork descriptions, photography rules, gift shop, cloakroom.',
  'Parc':                 'Cover: nature vocabulary (trees/flowers), paths and trails, directions, picnic, playground, sports, weather talk, no-entry signs.',
  "Parc d'attractions":   'Cover: tickets/passes, wait times, ride names, safety instructions, fast-track, food stalls, lost and found, expressing excitement/fear.',
  'Supermarché':          'Cover: aisles, asking where products are, labels (ingredients, expiry), weights and measures, checkout, loyalty cards, price per kilo, bio section.',
  'Marché':               'Cover: fruit/vegetables, negotiating prices, quantities (un kilo, une botte), asking for samples, artisan products, local specialties.',
  'Gare / Aéroport':      'Cover: buying tickets, platforms/gates, departures/arrivals board, check-in, baggage drop, security, boarding, delays, customs.',
  'Hôtel':                'Cover: check-in/check-out, room types, amenities, room service, concierge, complaints, billing, key cards.',
  'Chez le médecin':      'Cover: making an appointment, describing symptoms, body parts, duration of illness, prescriptions, follow-up, health insurance vocabulary.',
  'Pharmacie':            'Cover: prescription/OTC medicine, describing symptoms, dosage instructions, side effects, vitamins, medical devices, opening hours.',
  'Plage':                'Cover: beach equipment (towel, umbrella, sunscreen), water sports, safety flags, food stalls, renting equipment, asking directions.',
  'Cinéma / Théâtre':     'Cover: buying tickets, seat selection, showtimes, concessions, finding your seat, film synopsis, subtitles/dubbing, intermission.',
  'Dans la rue':          'Cover: directions (turn left/right, straight ahead), landmarks, public transport (bus/metro/taxi), crossing the road, getting lost, addresses.',
  'Bureau / Travail':     'Cover: introductions, scheduling meetings, email phrases, office equipment, asking for help, project vocabulary, working from home, breaks.',
  'Université / École':   'Cover: registering for classes, finding classrooms, asking professors questions, library, group projects, exams/grades, student facilities.',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Combo {
  target: string
  native: string
  location: string
  level: 'beginner' | 'intermediate' | 'advanced'
}

interface CardRow {
  word:                string
  phonetic:            string | null
  translation:         string
  example:             string | null
  example_translation: string | null
  level:               string
  location_id:         string
  target_lang:         string
  native_lang:         string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildAllCombos(): Combo[] {
  const combos: Combo[] = []
  for (const pair of LANG_PAIRS)
    for (const location of LOCATIONS)
      for (const level of LEVELS)
        combos.push({ target: pair.target, native: pair.native, location, level })
  return combos
}

async function generateCards(combo: Combo): Promise<CardRow[]> {
  const { target, native, location, level } = combo
  const contentGuide = CONTENT_GUIDE[level] ?? ''
  const domain = DOMAIN_HINTS[location] ?? ''

  const prompt = `You are a native ${target} speaker creating immersive location-based flashcards.
Scenario: the learner has just walked into a "${location}" in a ${target}-speaking country.
Native language: "${native}". Learning: "${target}". Level: "${level}".
${domain ? `\nLocation coverage guide (vary vocabulary across sessions): ${domain}\n` : ''}
${contentGuide}

CRITICAL LANGUAGE RULE: Write "word" and "example" exactly as a native ${target} speaker would say them spontaneously. Do NOT translate from ${native} — compose directly in ${target} first. Only "translation" and "exampleTranslation" are in ${native}.

Generate exactly ${CARDS_PER_COMBO} entries. Respond ONLY with a valid JSON array — no markdown, no explanation.
Each object must have these exact keys:
  "word"               — in ${target}, natural and idiomatic
  "phonetic"           — pronunciation in latin characters (omit if ${target} already uses latin script)
  "translation"        — translation of "word" into ${native}
  "example"            — in ${target}, natural and idiomatic
  "exampleTranslation" — translation of "example" into ${native}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://polyglot.vercel.app',
      'X-Title': 'Polyglot Seeder',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a native speaker and language teacher for ${target}. Write all target-language content as a native speaker would — idiomatic and natural, never a literal translation.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 1400,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenRouter ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const jsonStr = raw
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/, '')
    .trim()

  const cards = JSON.parse(jsonStr) as Record<string, string>[]
  if (!Array.isArray(cards)) throw new Error('AI response is not a JSON array')

  return cards.map((c) => ({
    word:                c.word,
    phonetic:            c.phonetic ?? null,
    translation:         c.translation,
    example:             c.example ?? null,
    example_translation: c.exampleTranslation ?? null,
    level,
    location_id:         location,
    target_lang:         target,
    native_lang:         native,
  }))
}

// ── Main ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Auth : Supabase injecte automatiquement le bon header pour les crons internes.
  // Pour les appels manuels, vérifier le CRON_SECRET.
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (cronSecret) {
    const auth = req.headers.get('Authorization') ?? ''
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // Lecture optionnelle d'un combo manuel dans le body
  let manualCombo: Combo | null = null
  try {
    if (req.method === 'POST' && req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json() as Partial<Combo>
      if (body.target && body.native && body.location && body.level) {
        manualCombo = {
          target:   String(body.target),
          native:   String(body.native),
          location: String(body.location),
          level:    body.level as 'beginner' | 'intermediate' | 'advanced',
        }
      }
    }
  } catch { /* body non-JSON — ignorer */ }

  const allCombos = buildAllCombos()

  // Sélection du batch : rotation déterministe basée sur l'heure courante.
  // Avec un cron toutes les 6h et BATCH_SIZE=4, la couverture complète
  // (15 paires × 16 lieux × 3 niveaux = 720 combos) prend ~108 jours.
  const SLOT_MS = 6 * 60 * 60 * 1000
  const slotIdx = Math.floor(Date.now() / SLOT_MS)
  const startIdx = (slotIdx * BATCH_SIZE) % allCombos.length

  const batchCombos: Combo[] = manualCombo
    ? [manualCombo]
    : Array.from({ length: BATCH_SIZE }, (_, i) => allCombos[(startIdx + i) % allCombos.length])

  type SeedResult = { combo: string; inserted: number; skipped?: boolean; error?: string }
  const results: SeedResult[] = []

  for (const combo of batchCombos) {
    const label = `${combo.target}/${combo.native} @ ${combo.location} [${combo.level}]`

    try {
      // Éviter de re-seeder un combo déjà bien rempli
      const { count } = await supabase
        .from('global_cards')
        .select('*', { count: 'exact', head: true })
        .eq('target_lang', combo.target)
        .eq('native_lang',  combo.native)
        .eq('location_id',  combo.location)
        .eq('level',        combo.level)

      if ((count ?? 0) >= MIN_THRESHOLD) {
        results.push({ combo: label, inserted: 0, skipped: true })
        continue
      }

      const cards = await generateCards(combo)

      // ignoreDuplicates: true — ne pas gonfler generated_count pour les cartes seedées
      const { error: upsertError } = await supabase
        .from('global_cards')
        .upsert(cards, {
          onConflict:       'word,target_lang,native_lang,level',
          ignoreDuplicates: true,
        })

      if (upsertError) throw new Error(upsertError.message)

      results.push({ combo: label, inserted: cards.length })

      // Pause pour respecter les rate limits OpenRouter
      await new Promise((r) => setTimeout(r, 600))
    } catch (err) {
      results.push({ combo: label, inserted: 0, error: (err as Error).message })
    }
  }

  const totalInserted = results.reduce((acc, r) => acc + r.inserted, 0)
  console.log(`[seed-global-cards] slot=${slotIdx} inserted=${totalInserted}`, results)

  return new Response(
    JSON.stringify({ slot: slotIdx, total_inserted: totalInserted, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
