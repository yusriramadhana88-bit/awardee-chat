/**
 * Ambil daftar subscriber newsletter (member dengan newsletter_opt_in = true) + link unsubscribe
 * per-orang, buat dipakai oleh scheduled task pengirim newsletter 3x/minggu.
 *
 * CARA PAKAI:
 *   node scripts/newsletter-subscribers.mjs
 *   (butuh DATABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.local, sama seperti run-migration.mjs)
 *
 * Output: JSON array ke stdout — [{ id, email, name, unsubscribeUrl }, ...]
 */

import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { createHmac } from 'crypto'
import pg from 'pg'

const { Client } = pg

function readEnvKey(key) {
  const envPath = resolve(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim().replace(/\r$/, '')
      if (trimmed.startsWith(key + '=')) return trimmed.substring(key.length + 1).trim()
    }
  }
  return process.env[key] ?? ''
}

// Sama persis dengan lib/newsletter.ts computeUnsubscribeToken() — kalau logic di sana berubah,
// update juga di sini (skrip Node terpisah, tidak bisa import langsung dari TypeScript app).
function computeUnsubscribeToken(profileId, secret) {
  return createHmac('sha256', secret).update(profileId).digest('hex').slice(0, 16)
}

async function main() {
  const dbUrl = readEnvKey('DATABASE_URL')
  const serviceRoleKey = readEnvKey('SUPABASE_SERVICE_ROLE_KEY')
  if (!dbUrl) {
    console.error('DATABASE_URL tidak ditemukan di .env.local')
    process.exit(1)
  }
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local')
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    const result = await client.query(`
      SELECT p.id, u.email, p.name
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE p.newsletter_opt_in = true
        AND u.email IS NOT NULL
        AND u.email_confirmed_at IS NOT NULL
      ORDER BY p.created_at ASC
    `)

    const subscribers = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name || row.email.split('@')[0],
      unsubscribeUrl: `https://member.awardee.id/api/newsletter/unsubscribe?uid=${encodeURIComponent(row.id)}&token=${computeUnsubscribeToken(row.id, serviceRoleKey)}`,
    }))

    console.log(JSON.stringify(subscribers, null, 2))
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
