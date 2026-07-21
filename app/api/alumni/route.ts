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

// Statistik agregat lintas semua alumni approved — dampak kolektif, bukan data personal siapa pun
async function getCollectiveStats(admin: ReturnType<typeof getAdminSupabase>) {
  const { count: alumniCount } = await admin
    .from('alumni')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { data: allContributions } = await admin
    .from('alumni_contributions')
    .select('hours')

  const totalContributions = allContributions?.length || 0
  const totalHours = (allContributions || []).reduce((sum: number, c: { hours: number | null }) => sum + (Number(c.hours) || 0), 0)

  return { alumniCount: alumniCount || 0, totalContributions, totalHours }
}

// GET: status alumni user saat ini + log kontribusi
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data: alumni } = await admin
    .from('alumni')
    .select('id, scholarship_name, university, graduation_year, story, status, created_at, approved_at')
    .eq('user_id', user.id)
    .single()

  if (!alumni) return NextResponse.json({ alumni: null, contributions: [], collectiveStats: await getCollectiveStats(admin) })

  const { data: contributions } = await admin
    .from('alumni_contributions')
    .select('id, contribution_type, description, hours, contributed_at, created_at')
    .eq('alumni_id', alumni.id)
    .order('contributed_at', { ascending: false })
    .limit(100)

  const collectiveStats = await getCollectiveStats(admin)

  return NextResponse.json({ alumni, contributions: contributions || [], collectiveStats })
}

// POST: ajukan jadi Awardee Alumni
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scholarship_name, university, graduation_year, story } = await req.json()
  if (!scholarship_name || typeof scholarship_name !== 'string') {
    return NextResponse.json({ error: 'Nama beasiswa wajib diisi.' }, { status: 400 })
  }

  const admin = getAdminSupabase()

  const { data: existing } = await admin.from('alumni').select('id').eq('user_id', user.id).single()
  if (existing) return NextResponse.json({ error: 'Kamu sudah punya pengajuan Awardee Alumni.' }, { status: 400 })

  const { data: alumni, error } = await admin
    .from('alumni')
    .insert({
      user_id: user.id,
      scholarship_name,
      university: university || null,
      graduation_year: graduation_year || null,
      story: story || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alumni })
}
