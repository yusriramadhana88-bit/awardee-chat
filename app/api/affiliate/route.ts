import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

function getSupabaseWithToken(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

function generateCode(name: string): string {
  const base = name.replace(/\s+/g, '').toUpperCase().slice(0, 6) || 'REF'
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
  return `${base}${suffix}`
}

// GET: status afiliasi user saat ini + statistik
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, referral_code, commission_rate, total_earned, total_paid, status, created_at')
    .eq('user_id', user.id)
    .single()

  if (!affiliate) return NextResponse.json({ affiliate: null })

  const { data: referrals } = await admin
    .from('referrals')
    .select('id, clicked_at, converted_at, commission_earned, payout_status')
    .eq('affiliate_id', affiliate.id)
    .order('clicked_at', { ascending: false })
    .limit(50)

  const clicks = (referrals || []).length
  const conversions = (referrals || []).filter(r => r.converted_at).length
  const pendingCommission = (referrals || [])
    .filter(r => r.converted_at && r.payout_status === 'pending')
    .reduce((sum, r) => sum + (r.commission_earned ?? 0), 0)

  return NextResponse.json({ affiliate, referrals: referrals || [], stats: { clicks, conversions, pendingCommission } })
}

// POST: daftar jadi afiliasi (generate referral code)
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  // Cek sudah ada afiliasi?
  const { data: existing } = await admin.from('affiliates').select('id').eq('user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'Kamu sudah terdaftar sebagai afiliasi.' }, { status: 400 })

  // Get profile name for code
  const { data: profile } = await admin.from('profiles').select('name').eq('id', user.id).single()
  let code = generateCode(profile?.name ?? '')

  // Ensure unique
  let attempt = 0
  while (attempt < 5) {
    const { data: clash } = await admin.from('affiliates').select('id').eq('referral_code', code).single()
    if (!clash) break
    code = generateCode(profile?.name ?? '') + attempt
    attempt++
  }

  const { data: affiliate, error } = await admin
    .from('affiliates')
    .insert({ user_id: user.id, referral_code: code })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate })
}
