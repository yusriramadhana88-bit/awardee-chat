import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { grantTopup } from '@/lib/ai-quota'

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

// POST: aktivasi Booster Kuota AI untuk user setelah admin verifikasi bukti bayar manual via WhatsApp.
export async function POST(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, packageId } = await req.json()
  if (!userId || !packageId) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const admin = getAdminSupabase()
  const result = await grantTopup(admin, userId, packageId, adminUser.id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })

  return NextResponse.json({ ok: true })
}
