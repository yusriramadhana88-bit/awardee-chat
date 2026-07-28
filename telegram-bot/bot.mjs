import 'dotenv/config'
import { Bot, InputFile } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const LANDING_PAGE_URL = process.env.LANDING_PAGE_URL || 'https://awardee.id/lp/aas-interview'

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN belum diisi di .env')
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env belum diisi di .env')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const bot = new Bot(BOT_TOKEN)

const PDF_PATH = path.join(__dirname, 'assets', 'Panduan-Lolos-Interview-AAS.pdf')

// This bot always identifies itself as an automated bot. It never pretends to be
// a human, and it never messages a chat first — Telegram itself enforces this,
// since a bot can only message a user after that user presses Start.
bot.command('start', async (ctx) => {
  const leadId = ctx.match?.trim()

  if (!leadId) {
    await ctx.reply(
      '👋 Halo! Ini *bot otomatis resmi Awardee.id* (bukan chat pribadi).\n\n' +
      'Bot ini ngirim materi gratis ke orang yang daftar lewat landing page kami. ' +
      `Kalau kamu mau ambil "Panduan Lolos Interview AAS", isi dulu namamu di:\n${LANDING_PAGE_URL}`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, name, status')
    .eq('id', leadId)
    .maybeSingle()

  if (error || !lead) {
    await ctx.reply(
      '👋 Halo! Ini *bot otomatis resmi Awardee.id*.\n\n' +
      'Link yang kamu pakai sepertinya sudah tidak valid. Coba isi ulang formnya di:\n' +
      LANDING_PAGE_URL,
      { parse_mode: 'Markdown' }
    )
    return
  }

  await supabase
    .from('leads')
    .update({
      telegram_chat_id: ctx.chat.id,
      telegram_username: ctx.from?.username ?? null,
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  await ctx.reply(
    `👋 Halo ${lead.name}! Ini *bot otomatis resmi Awardee.id* (bukan chat pribadi Dhana).\n\n` +
    'Ini panduan yang kamu minta 🎓',
    { parse_mode: 'Markdown' }
  )
  await ctx.replyWithDocument(new InputFile(PDF_PATH), {
    caption: 'Panduan Lolos Interview AAS — Awardee.id',
  })
  await ctx.reply(
    'Sesekali bot ini bakal kirim update/tips seputar AAS & beasiswa lain. ' +
    'Kamu bisa mute atau block bot ini kapan aja kalau nggak mau terima lagi.'
  )
})

// Any other message: remind people this is an automated bot, point them to human contact channels.
bot.on('message', async (ctx) => {
  await ctx.reply(
    'Bot ini otomatis dan cuma ngirim materi/​update, jadi nggak bisa balas pertanyaan bebas. ' +
    'Untuk ngobrol sama tim Awardee.id, chat WhatsApp atau Instagram @awardee.id ya.'
  )
})

bot.start()
console.log('Awardee.id Telegram bot is running (long polling)...')
