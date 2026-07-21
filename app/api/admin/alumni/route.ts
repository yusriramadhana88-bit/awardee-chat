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

// GET: daftar semua pengajuan/anggota alumni + jumlah kontribusi
export async function GET(req: NextRequest) {
  const admin = await assertAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdminSupabase()

  const { data: alumni } = await supabase
    .from('alumni')
    .select(`
      id, scholarship_name, university, graduation_year, story, status, created_at, approved_at,
      profiles!alumni_user_id_fkey (id, name, email)
    `)
    .order('created_at', { ascending: false })

  const { data: contributions } = await supabase
    .from('alumni_contributions')
    .select('alumni_id, hours')

  const statsMap: Record<string, { count: number; hours: number }> = {}
  for (const c of contributions || []) {
    if (!statsMap[c.alumni_id]) statsMap[c.alumni_id] = { count: 0, hours: 0 }
    statsMap[c.alumni_id].count++
    statsMap[c.alumni_id].hours += Number(c.hours) || 0
  }

  const result = (alumni || []).map(a => ({
    ...a,
    contribution_count: statsMap[a.id]?.count ?? 0,
    contribution_hours: statsMap[a.id]?.hours ?? 0,
  }))

  return NextResponse.json({ alumni: result })
}

// PATCH: approve / reject pengajuan alumni
export async function PATCH(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { alumniId, action } = await req.json()
  if (!alumniId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const status = action === 'approve' ? 'approved' : 'rejected'
  const { error } = await supabase
    .from('alumni')
    .update({ status, approved_at: action === 'approve' ? new Date().toISOString() : null })
    .eq('id', alumniId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, status })
}
