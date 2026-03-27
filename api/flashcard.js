/**
 * POST /api/flashcard
 * Body: { targetLang, nativeLang, level, theme }
 * Returns: { cards: [{ word, phonetic, translation, example, exampleTranslation }] }
 */
import { supabaseAdmin } from '../lib/supabase-server.js'
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { targetLang, nativeLang, level, location, seenWords, newCount } = req.body ?? {}

  if (!targetLang || !nativeLang || !level || !location) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // Basic input sanitization — strip control characters and limit length
  const safe = (v) => String(v).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80)
  const sTargetLang = safe(targetLang)
  const sNativeLang = safe(nativeLang)
  const sLevel = safe(level)
  const sLocation = safe(location)

  const ALLOWED_LEVELS = ['beginner', 'intermediate', 'advanced']
  if (!ALLOWED_LEVELS.includes(sLevel)) {
    return res.status(400).json({ error: 'Invalid level' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' })
  }

  const contentGuide = {
    beginner: `Each "word" = a single noun, verb, or common object found at this location. Each "example" = a very short sentence (3–6 words) placing that word in context at this specific location.`,
    intermediate: `Each "word" = a natural phrase or sentence someone would say at this location (4–9 words). Each "example" = a follow-up sentence or response that continues the conversation at this location.`,
    advanced: `Each "word" = a natural question someone asks at this location. Each "example" = a realistic, natural answer to that exact question.`,
  }[sLevel]

  // Semantic domain hints per location — ensures full coverage across sessions
  const domainHints = {
    'Restaurant': 'Cover across sessions: greetings on arrival, asking for a table, reading the menu, ordering starters/mains/desserts/drinks, asking about allergens, specials of the day, cooking methods, condiments, asking for the bill, splitting the bill, complimenting the food, complaining politely, tipping customs, takeaway vocabulary.',
    'Café / Brasserie': 'Cover: ordering coffee/tea/pastries, asking for wifi, asking for a receipt, working at a café, meeting someone, small talk, describing drinks, breakfast items, paying at the counter.',
    'Musée': 'Cover: buying tickets, asking for audio guides, reading exhibit labels, guided tour vocabulary, asking about opening hours, artwork descriptions (sculpture/painting/installation), photography rules, gift shop, cloakroom.',
    'Parc': 'Cover: trees/flowers/nature vocabulary, paths and trails, asking for directions, picnic vocabulary, playground, sports (jogging/cycling/ball games), weather talk, animals in the park, benches/fountains, no dogs/keep off grass signs.',
    "Parc d'attractions": 'Cover: buying tickets/passes, wait times, ride names/descriptions, safety instructions, height restrictions, fast-track, food stalls, lost and found, gift shops, expressing excitement/fear.',
    'Supermarché': 'Cover: aisles/sections, asking where products are, reading labels (ingredients, expiry dates), weights and measures, checkout, bags, loyalty cards, price per kilo, organic/bio products, frozen section, bakery counter.',
    'Marché': 'Cover: fruit/vegetables, haggling/negotiating prices, quantities (un kilo, une botte), asking for samples, artisan products, local specialties, payment methods, carrying bags.',
    'Gare / Aéroport': 'Cover: buying tickets, platforms/gates, departures/arrivals board, check-in, baggage drop, security control, boarding pass, delays/cancellations, announcements, customs, taxi/bus to city, lost luggage.',
    'Hôtel': 'Cover: check-in/check-out, room types, asking for amenities (towels, wifi, wake-up call), room service, reception requests, breakfast hours, key cards, concierge, complaints, billing.',
    'Chez le médecin': 'Cover: making an appointment, describing symptoms, body parts, duration of illness, medical history, prescriptions, referrals, follow-up, health insurance vocabulary.',
    'Pharmacie': 'Cover: asking for medicine (prescription/OTC), describing symptoms to pharmacist, dosage instructions, side effects, vitamins/supplements, medical devices (thermometer, bandage), opening hours.',
    'Plage': 'Cover: beach equipment (towel, umbrella, sunscreen), water sports, swimming safety (flags/currents), food/ice cream stalls, asking for directions to beach facilities, renting equipment.',
    'Cinéma / Théâtre': 'Cover: buying tickets (seat selection, showtimes), concessions, finding your seat, asking about film/play synopsis, subtitles/dubbing, intermission, applause etiquette.',
    'Dans la rue': 'Cover: asking for directions (turn left/right, straight ahead), landmarks, public transport (bus stop, metro, taxi), crossing the road, map reading, getting lost, addresses.',
    'Bureau / Travail': 'Cover: introductions, scheduling meetings, email phrases, office equipment, asking for help, project vocabulary, feedback, working from home, breaks, end-of-day.',
    'Université / École': 'Cover: registering for classes, finding classrooms/offices, asking professors questions, library vocabulary, group projects, exams/grades, student facilities, clubs.',
  }
  const domain = domainHints[sLocation] || ''

  // Sanitize seenWords list — cap at 60 words to keep prompt size reasonable
  const safeSeenWords = Array.isArray(seenWords)
    ? seenWords.slice(0, 60).map((w) => safe(String(w))).filter(Boolean)
    : []

  // How many new cards to generate (reduced when review cards are injected client-side)
  const cardCount = Math.max(1, Math.min(8, Number.isInteger(newCount) ? newCount : 8))

  const avoidClause = safeSeenWords.length > 0
    ? `\nIMPORTANT: The learner has already seen these words/phrases — do NOT repeat them:\n${safeSeenWords.map((w) => `- ${w}`).join('\n')}\nGenerate ${cardCount} entirely new and different entries for this location.\n`
    : ''

  const prompt = `You are a native ${sTargetLang} speaker creating immersive location-based flashcards.
Scenario: the learner has just walked into a "${sLocation}" in a ${sTargetLang}-speaking country.
Native language: "${sNativeLang}". Learning: "${sTargetLang}". Level: "${sLevel}".
${domain ? `\nLocation coverage guide (use this to vary across sessions and ensure exhaustive vocabulary): ${domain}\n` : ''}
${avoidClause}
${contentGuide}

CRITICAL LANGUAGE RULE: Write "word" and "example" exactly as a native ${sTargetLang} speaker would say them spontaneously in this situation. Do NOT translate from ${sNativeLang} — compose directly in ${sTargetLang} first. The phrase must sound natural and idiomatic to a native speaker, not like a literal translation. Only "translation" and "exampleTranslation" are rendered in ${sNativeLang}.

Generate exactly ${cardCount} entries. Respond ONLY with a valid JSON array — no markdown, no explanation.
Each object must have these exact keys:
  "word"               — [see instructions above] in ${sTargetLang}, natural and idiomatic
  "phonetic"           — pronunciation guide in latin characters (omit if already latin script)
  "translation"        — translation of "word" into ${sNativeLang}
  "example"            — [see instructions above] in ${sTargetLang}, natural and idiomatic
  "exampleTranslation" — translation of "example" into ${sNativeLang}`

  const systemPrompt = `You are a native speaker and language teacher for ${sTargetLang}. You write all target-language content as a native speaker would — idiomatic, natural, never like a translation.`

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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 1400,
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

    // ── Sync new cards to the shared global pool ──────────────────────────────
    // This feeds the "Standard mode" browsing. Non-blocking: a sync failure
    // never breaks the response. Requires SUPABASE_SERVICE_ROLE_KEY in env.
    if (supabaseAdmin) {
      const globalRows = cards.map((c) => ({
        word:                c.word,
        phonetic:            c.phonetic ?? null,
        translation:         c.translation,
        example:             c.example ?? null,
        example_translation: c.exampleTranslation ?? null,
        level:               sLevel,
        location_id:         sLocation,
        target_lang:         sTargetLang,
        native_lang:         sNativeLang,
      }))
      // On conflict: increment generated_count so popular cards sort higher
      const { error: syncErr } = await supabaseAdmin
        .from('global_cards')
        .upsert(globalRows, { onConflict: 'word,target_lang,native_lang,level', ignoreDuplicates: false })
      if (syncErr) console.error('[global_cards sync]', syncErr.message)
    }

    return res.status(200).json({ cards })
  } catch (err) {
    console.error('Flashcard handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
