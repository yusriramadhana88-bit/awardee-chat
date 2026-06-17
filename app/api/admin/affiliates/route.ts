import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'

function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    loadEnvKey('SUPABASE_SERVICE_ROLE_KEY'),
  )
}

async function assertAdmin(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return null
  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const admin = getAdminSupabase()
  const { data } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET: daftar semua afiliasi + referral stats
export async function GET(req: NextRequest) {
  const admin = await assertAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdminSupabase()

  const { data: affiliates } = await supabase
    .from('affiliates')
    .select(`
      id, referral_code, commission_rate, total_earned, total_paid, status, created_at,
      profiles!affiliates_user_id_fkey (id, name)
    `)
    .order('total_earned', { ascending: false })

  const { data: referralStats } = await supabase
    .from('referrals')
    .select('affiliate_id, converted_at, payout_status')

  const statsMap: Record<string, { clicks: number; conversions: number; pending: number }> = {}
  for (const r of referralStats || []) {
    if (!statsMap[r.affiliate_id]) statsMap[r.affiliate_id] = { clicks: 0, conversions: 0, pending: 0 }
    statsMap[r.affiliate_id].clicks++
    if (r.converted_at) statsMap[r.affiliate_id].conversions++
    if (r.payout_status === 'pending' && r.converted_at) statsMap[r.affiliate_id].pending++
  }

  const result = (affiliates || []).map(a => ({
    ...a,
    clicks: statsMap[a.id]?.clicks ?? 0,
    conversions: statsMap[a.id]?.conversions ?? 0,
    pending_payouts: statsMap[a.id]?.pending ?? 0,
  }))

  return NextResponse.json({ affiliates: result })
}

// PATCH: approve payout atau update status afiliasi
export async function PATCH(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, affiliateId, referralId } = await req.json()
  const supabase = getAdminSupabase()

  if (action === 'approve_payout' && referralId) {
    const { error } = await supabase
      .from('referrals')
      .update({ payout_status: 'paid' })
      .eq('id', referralId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update total_paid di affiliates
    const { data: ref } = await supabase.from('referrals').select('affiliate_id, commission_earned').eq('id', referralId).single()
    if (ref) {
      await supabase.rpc('increment_affiliate_paid', { aff_id: ref.affiliate_id, amount: ref.commission_earned ?? 0 }).maybeSingle()
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'toggle_status' && affiliateId) {
    const { data } = await supabase.from('affiliates').select('status').eq('id', affiliateId).single()
    const newStatus = data?.status === 'active' ? 'suspended' : 'active'
    await supabase.from('affiliates').update({ status: newStatus }).eq('id', affiliateId)
    return NextResponse.json({ ok: true, status: newStatus })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
