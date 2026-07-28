import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { awardAchievement } from '@/lib/achievements-server'

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

const ALLOWED_FIELDS = [
  'applicant_category', 'jenjang', 'status_kerja', 'target_kampus', 'target_prodi', 'rencana_kontribusi',
] as const

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('aas_profiles').select('*').eq('user_id', user.id).maybeSingle()

  return NextResponse.json({ profile: profile ?? null })
}

export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada data untuk disimpan' }, { status: 400 })
  }

  const { data: existing } = await supabase.from('aas_profiles').select('user_id').eq('user_id', user.id).maybeSingle()
  const isFirstTime = !existing

  const { data: saved, error } = await supabase
    .from('aas_profiles')
    .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (isFirstTime) {
    const admin = getAdminSupabase()
    await awardAchievement(admin, user.id, 'aas_profile_set')
  }

  return NextResponse.json({ profile: saved })
}
