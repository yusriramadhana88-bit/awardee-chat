// Manual broadcast script — sends a message ONLY to leads who already pressed
// Start on the bot themselves (telegram_chat_id is set). This never messages
// anyone who hasn't opted in.
//
// Usage:
//   node broadcast.mjs path/to/message.txt            (dry run — shows preview + recipient count, sends nothing)
//   node broadcast.mjs path/to/message.txt --send      (actually sends)
//
// Optionally scope to one campaign: node broadcast.mjs message.txt --send --source=aas-interview

import 'dotenv/config'
import { Bot } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN belum diisi di .env')
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env belum diisi di .env')

const args = process.argv.slice(2)
const messagePath = args.find((a) => !a.startsWith('--'))
const shouldSend = args.includes('--send')
const sourceArg = args.find((a) => a.startsWith('--source='))
const sourceFilter = sourceArg ? sourceArg.split('=')[1] : null

if (!messagePath) {
  console.error('Pakai: node broadcast.mjs path/to/message.txt [--send] [--source=aas-interview]')
  process.exit(1)
}

const message = readFileSync(messagePath, 'utf-8').trim()
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const bot = new Bot(BOT_TOKEN)

let query = supabase
  .from('leads')
  .select('id, name, telegram_chat_id, source')
  .eq('status', 'delivered')
  .not('telegram_chat_id', 'is', null)

if (sourceFilter) query = query.eq('source', sourceFilter)

const { data: recipients, error } = await query
if (error) {
  console.error('Gagal ambil daftar recipient:', error.message)
  process.exit(1)
}

console.log(`--- PREVIEW PESAN ---\n${message}\n---------------------`)
console.log(`Penerima: ${recipients.length} orang yang sudah opt-in via bot${sourceFilter ? ` (source: ${sourceFilter})` : ''}.`)

if (!shouldSend) {
  console.log('\nIni dry run. Tidak ada pesan terkirim. Tambahkan --send kalau sudah yakin.')
  process.exit(0)
}

console.log('\nMengirim...')
let sent = 0
let failed = 0
for (const r of recipients) {
  try {
    await bot.api.sendMessage(r.telegram_chat_id, message)
    sent++
  } catch (err) {
    failed++
    console.warn(`Gagal kirim ke lead ${r.id} (${r.name}): ${err.message}`)
  }
  // Stay well under Telegram's rate limits (~30 msg/sec global).
  await new Promise((resolve) => setTimeout(resolve, 50))
}

console.log(`\nSelesai. Terkirim: ${sent}, Gagal: ${failed} (biasanya karena user sudah block bot).`)
