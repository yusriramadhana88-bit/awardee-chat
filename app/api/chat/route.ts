import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAnthropic, HAIKU_MODEL } from '@/lib/anthropic'
import { buildSystemPrompt } from '@/lib/prompts'
import { BOTS, type BotId } from '@/lib/bots'

// Widget guest chat di awardee.id (situs statis, origin terpisah) mem-POST ke sini
// lintas-domain — perlu CORS eksplisit untuk origin marketing site.
const ALLOWED_ORIGINS = ['https://awardee.id', 'https://www.awardee.id']

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Id',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

function getSupabaseWithToken(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DAILY_LIMITS: Record<string, number> = { free: 5, kopi: 20, starter: 50, pro: 999 }
const GUEST_DAILY_LIMIT = 8

function resolveBot(value: unknown): BotId {
  return value === 'aas' || value === 'lpdp' ? value : 'cs'
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req.headers.get('origin'))
  const json = (body: unknown, init?: { status?: number }) =>
    NextResponse.json(body, { status: init?.status, headers: cors })

  try {
    // Body di-parse sekali di awal (bukan per-cabang seperti sebelumnya) supaya `bot` sudah
    // diketahui sebelum menentukan jalur guest/member — dan supaya request tidak valid gagal
    // cepat sebelum menyentuh database sama sekali.
    const { messages, bot: botParam } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Invalid request' }, { status: 400 })
    }
    const bot = resolveBot(botParam)

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''

    if (!token) {
      // Guest (belum login) — tetap boleh chat supaya bisa bangun trust dulu sebelum diminta daftar,
      // lihat aturan "JANGAN minta daftar di awal" di lib/prompts.ts. Dipanggil lintas-domain
      // dari widget floating di awardee.id, makanya butuh CORS (lihat corsHeaders di atas).
      if (!BOTS[bot].guestAllowed) {
        return json({ error: 'MEMBER_ONLY_BOT' }, { status: 403 })
      }

      const guestId = req.headers.get('X-Guest-Id')?.slice(0, 100) ?? ''
      if (!guestId) {
        return json({ error: 'GUEST_ID_REQUIRED' }, { status: 400 })
      }

      const today = new Date().toISOString().split('T')[0]
      const admin = getSupabaseAdmin()
      const { data: usage } = await admin
        .from('guest_chat_usage')
        .select('count')
        .eq('guest_id', guestId)
        .eq('date', today)
        .single()

      const currentCount = usage?.count || 0
      if (currentCount >= GUEST_DAILY_LIMIT) {
        return json(
          { error: 'GUEST_LIMIT_REACHED', guestUsed: currentCount, guestLimit: GUEST_DAILY_LIMIT },
          { status: 429 }
        )
      }

      await admin.from('guest_chat_usage').upsert({
        guest_id: guestId,
        date: today,
        count: currentCount + 1,
      }, { onConflict: 'guest_id,date' })

      const response = await getAnthropic().messages.create({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(bot, true),
        messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      return json({ message: text, guestUsed: currentCount + 1, guestLimit: GUEST_DAILY_LIMIT })
    }

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ambil tier user + phone untuk cek uniqueness
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at, phone')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    const limit = DAILY_LIMITS[tier] ?? 5

    // Cek phone uniqueness untuk tier free — wajib ada phone terverifikasi
    if (tier === 'free' && !profile?.phone) {
      return json({ error: 'PHONE_REQUIRED' }, { status: 403 })
    }
    const today = new Date().toISOString().split('T')[0]

    // Cek dan update usage harian — counter dibagi rata lintas ketiga bot (CS/AAS/LPDP)
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const currentCount = usage?.count || 0
    if (currentCount >= limit) {
      return json({ error: 'LIMIT_REACHED' }, { status: 429 })
    }

    // Upsert usage counter (pakai admin key untuk bypass RLS)
    await getSupabaseAdmin().from('daily_usage').upsert({
      user_id: user.id,
      date: today,
      count: currentCount + 1,
    }, { onConflict: 'user_id,date' })

    const response = await getAnthropic().messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(bot, false),
      messages: messages.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return json({ message: text })
  } catch (error) {
    console.error('Error:', error)
    return json({ error: 'Gagal terhubung ke AI. Coba lagi ya.' }, { status: 500 })
  }
}
