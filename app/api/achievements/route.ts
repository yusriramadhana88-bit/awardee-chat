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

// GET: semua achievement + status earned/belum untuk user saat ini
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabaseWithToken(token)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminSupabase()

  const { data: achievements } = await admin
    .from('achievements')
    .select('id, code, title, description, icon, created_at')
    .order('created_at', { ascending: true })

  const { data: earned } = await admin
    .from('user_achievements')
    .select('achievement_id, earned_at')
    .eq('user_id', user.id)

  const earnedMap = new Map((earned || []).map(e => [e.achievement_id, e.earned_at]))

  const result = (achievements || []).map(a => ({
    ...a,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) || null,
  }))

  return NextResponse.json({
    achievements: result,
    earnedCount: earnedMap.size,
    totalCount: result.length,
  })
}
