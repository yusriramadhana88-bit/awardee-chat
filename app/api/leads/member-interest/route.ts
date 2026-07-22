import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

// Form publik "sneak peek member area" di awardee.id (situs statis, origin terpisah)
// mem-POST ke sini lintas-domain — perlu CORS eksplisit untuk origin marketing site.
const ALLOWED_ORIGINS = ['https://awardee.id', 'https://www.awardee.id']

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

// POST: simpan lead (nama, WA, email) dari form sneak-peek member area
export async function POST(req: NextRequest) {
  const headers = corsHeaders(req.headers.get('origin'))
  try {
    const { name, phone, email, source } = await req.json()

    if (!name?.trim() || !phone?.trim() || !email?.trim()) {
      return NextResponse.json({ ok: false, error: 'Nama, nomor WA, dan email wajib diisi' }, { status: 400, headers })
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!emailOk) {
      return NextResponse.json({ ok: false, error: 'Format email tidak valid' }, { status: 400, headers })
    }

    const admin = getAdminSupabase()
    const { error } = await admin.from('member_leads').insert({
      name: name.trim().slice(0, 200),
      phone: phone.trim().slice(0, 30),
      email: email.trim().slice(0, 200),
      source: (source || 'sneak_peek_main_page').trim().slice(0, 100),
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers })
    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500, headers })
  }
}
