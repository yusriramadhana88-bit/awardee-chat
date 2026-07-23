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
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminSupabase()
  const { data } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET: daftar semua user + usage hari ini
export async function GET(req: NextRequest) {
  const admin = await assertAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdminSupabase()
  const today = new Date().toISOString().split('T')[0]

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, phone, subscription_tier, subscription_expires_at, is_admin, created_at')
    .order('created_at', { ascending: false })

  const { data: usages } = await supabase
    .from('daily_usage')
    .select('user_id, count')
    .eq('date', today)

  const usageMap = Object.fromEntries((usages || []).map(u => [u.user_id, u.count]))

  const users = await Promise.all(
    (profiles || []).map(async p => {
      const { data: authData } = await supabase.auth.admin.getUserById(p.id)
      return {
        ...p,
        email: authData?.user?.email ?? null,
        chat_today: usageMap[p.id] ?? 0,
      }
    })
  )

  return NextResponse.json({ users })
}

// PATCH: upgrade/downgrade tier
export async function PATCH(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, tier } = await req.json()
  if (!userId || !['free', 'kopi', 'starter', 'pro'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: tier, subscription_expires_at: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
