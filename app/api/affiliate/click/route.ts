import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

// POST: catat 1 klik link referral (?ref=CODE), dipanggil client-side dari ReferralCapture
// begitu ada yang mendarat di halaman manapun lewat link referral. referee_user_id masih
// kosong di sini — baru di-attach ke user saat dia benar-benar daftar (lihat /api/confirm-user).
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const admin = getAdminSupabase()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('referral_code', code.toUpperCase())
    .single()

  if (!affiliate || affiliate.status !== 'active') {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  const { data: referral, error } = await admin
    .from('referrals')
    .insert({ affiliate_id: affiliate.id, referral_code: code.toUpperCase() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referralId: referral.id })
}
