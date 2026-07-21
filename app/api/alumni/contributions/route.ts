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

const VALID_TYPES = ['mentoring_session', 'webinar', 'referral', 'other']

// POST: log kontribusi baru (hanya untuk alumni yang sudah approved)
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { contribution_type, description, hours, contributed_at } = await req.json()
  if (!VALID_TYPES.includes(contribution_type)) {
    return NextResponse.json({ error: 'Jenis kontribusi tidak valid.' }, { status: 400 })
  }

  const admin = getAdminSupabase()

  const { data: alumni } = await admin.from('alumni').select('id, status').eq('user_id', user.id).single()
  if (!alumni) return NextResponse.json({ error: 'Kamu belum terdaftar sebagai Awardee Alumni.' }, { status: 403 })
  if (alumni.status !== 'approved') {
    return NextResponse.json({ error: 'Pengajuan Awardee Alumni kamu belum disetujui.' }, { status: 403 })
  }

  const { data: contribution, error } = await admin
    .from('alumni_contributions')
    .insert({
      alumni_id: alumni.id,
      contribution_type,
      description: description || null,
      hours: hours || null,
      contributed_at: contributed_at || new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contribution })
}
