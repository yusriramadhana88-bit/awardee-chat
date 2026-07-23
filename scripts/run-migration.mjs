/**
 * Migration runner — jalankan migration SQL ke Supabase via direct Postgres connection.
 *
 * CARA PAKAI:
 *   1. Tambahkan DATABASE_URL ke .env.local kamu:
 *      DATABASE_URL=postgresql://postgres.nprxqhvkpqdwxvjcxjzn:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
 *      (ambil dari: Supabase Dashboard → Project Settings → Database → URI)
 *
 *   2. Jalankan (satu atau lebih file migration, berurutan):
 *      node scripts/run-migration.mjs 008_tier_restructure.sql 009_scholarship_database.sql
 *
 *      Tanpa argumen filename, default ke 003_gamification_admin_affiliate.sql (untuk kompatibilitas lama).
 *
 *   3. Setelah berhasil, set akun admin kamu:
 *      node scripts/run-migration.mjs --set-admin yusri.ramadhana88@gmail.com
 */

import { createReadStream, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import pg from 'pg'

const { Client } = pg

// ── Baca DATABASE_URL ────────────────────────────────────────────────────────
function getDatabaseUrl() {
  // 1. Argumen CLI: node run-migration.mjs "postgresql://..."
  const urlArg = process.argv.slice(2).find(a => a.startsWith('postgresql://'))
  if (urlArg) return urlArg

  // 2. Environment variable langsung
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  // 3. Baca dari .env.local
  const envPath = resolve(process.cwd(), '.env.local')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim().replace(/\r$/, '')
      if (trimmed.startsWith('DATABASE_URL=')) {
        return trimmed.substring('DATABASE_URL='.length).trim()
      }
    }
  }

  return null
}

// ── Baca SQL migration files ─────────────────────────────────────────────────
function readMigrationFile(filename) {
  const path = resolve(process.cwd(), 'supabase', 'migrations', filename)
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const dbUrl = getDatabaseUrl()
  if (!dbUrl) {
    console.error('\n❌ DATABASE_URL tidak ditemukan!')
    console.error('\nTambahkan DATABASE_URL ke .env.local kamu:')
    console.error('  DATABASE_URL=postgresql://postgres.nprxqhvkpqdwxvjcxjzn:PASSWORD@aws-0-....pooler.supabase.com:6543/postgres')
    console.error('\nAmbil dari: Supabase Dashboard → Project Settings → Database → URI\n')
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })

  try {
    console.log('\n🔌 Menghubungkan ke database...')
    await client.connect()
    console.log('✅ Terhubung!\n')

    // ── Set admin mode ──────────────────────────────────────────────────────
    const setAdminArg = process.argv.indexOf('--set-admin')
    if (setAdminArg !== -1) {
      const email = process.argv[setAdminArg + 1]
      if (!email) {
        console.error('❌ Masukkan email setelah --set-admin')
        process.exit(1)
      }

      console.log(`👑 Set akun admin: ${email}`)
      const result = await client.query(
        `UPDATE profiles SET is_admin = true
         WHERE id = (
           SELECT id FROM auth.users WHERE email = $1 LIMIT 1
         )
         RETURNING id, is_admin`,
        [email]
      )

      if (result.rowCount === 0) {
        console.error(`❌ Akun dengan email "${email}" tidak ditemukan.`)
        console.error('   Pastikan kamu sudah register dulu di aplikasi.')
      } else {
        console.log(`✅ Akun ${email} sekarang admin!`)
      }
      return
    }

    // ── Run migration file(s) ───────────────────────────────────────────────
    const filenames = process.argv.slice(2).filter(a => a.endsWith('.sql'))
    if (filenames.length === 0) filenames.push('003_gamification_admin_affiliate.sql')

    for (const filename of filenames) {
      console.log(`📦 Menjalankan migration ${filename}...\n`)

      const sql = readMigrationFile(filename)
      if (!sql) {
        console.error(`❌ File migration tidak ditemukan: supabase/migrations/${filename}`)
        process.exit(1)
      }

      // Split SQL menjadi statement individual (pisahkan di titik koma)
      // Tapi harus hati-hati dengan isi function/procedure yang mengandung titik koma
      // Untuk migration flat seperti ini, split sederhana cukup.
      // Tiap chunk bisa diawali baris komentar (header file, atau catatan sebelum satu
      // statement) — itu harus DILUCUTI dulu, bukan bikin seluruh chunk dibuang, karena
      // SQL asli setelah komentar itu tetap harus dijalankan.
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.replace(/^(\s*--[^\n]*\n)+/, '').trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      let success = 0
      let skipped = 0

      for (const stmt of statements) {
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 80)
        try {
          await client.query(stmt)
          console.log(`  ✅ ${preview}...`)
          success++
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('duplicate')) {
            console.log(`  ⏭️  SKIP (sudah ada): ${preview}...`)
            skipped++
          } else {
            console.error(`  ❌ ERROR: ${err.message}`)
            console.error(`     SQL: ${preview}`)
          }
        }
      }

      console.log(`\n🎉 ${filename} selesai! ${success} berhasil, ${skipped} diskip (sudah ada).\n`)
    }

    console.log('📋 Langkah berikutnya (kalau belum admin):')
    console.log('   node scripts/run-migration.mjs --set-admin yusri.ramadhana88@gmail.com')

  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message)
  process.exit(1)
})
