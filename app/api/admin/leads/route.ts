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

// GET: semua lead untuk retargeting (WA/email database)
export async function GET(req: NextRequest) {
  const admin = await assertAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdminSupabase()
  const { data: leads } = await supabase
    .from('member_leads')
    .select('id, name, phone, email, source, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ leads: leads || [] })
}
