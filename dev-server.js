// Local development API server — replaces `vercel dev`
// Loads .env.local and serves /api/* handlers using Express

import { createRequire } from 'module'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env.local manually (dotenv doesn't read .env.local by default) ──────
try {
  const envPath = resolve(__dirname, '.env.local')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const val = trimmed.slice(eqIndex + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
  console.log('[dev-server] Loaded .env.local')
} catch {
  console.warn('[dev-server] Could not read .env.local')
}

// ── Dynamically import all handlers from /api ─────────────────────────────────
async function loadHandlers() {
  const { default: flashcard } = await import('./api/flashcard.js')
  return { flashcard }
}

const app = express()
app.use(express.json())

const handlers = await loadHandlers()

// Map each handler to its route
app.all('/api/flashcard', (req, res) => handlers.flashcard(req, res))

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001
app.listen(PORT, () => {
  console.log(`[dev-server] API ready → http://localhost:${PORT}/api`)
})
