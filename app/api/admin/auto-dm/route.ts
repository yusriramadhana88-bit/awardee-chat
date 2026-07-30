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

// GET: daftar semua rule + 10 log terakhir (buat cek apakah bot beneran jalan)
export async function GET(req: NextRequest) {
  const admin = await assertAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getAdminSupabase()
  const [{ data: rules }, { data: log }] = await Promise.all([
    supabase.from('auto_dm_rules').select('*').order('created_at', { ascending: false }),
    supabase.from('auto_dm_log').select('*').order('processed_at', { ascending: false }).limit(10),
  ])

  return NextResponse.json({ rules: rules ?? [], log: log ?? [] })
}

// POST: buat rule baru
export async function POST(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { triggerKeyword, replyMessage, dmMessage } = await req.json()
  if (!triggerKeyword || !replyMessage || !dmMessage) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const { data: rule, error } = await supabase
    .from('auto_dm_rules')
    .insert({
      trigger_keyword: triggerKeyword.trim(),
      reply_message: replyMessage.trim(),
      dm_message: dmMessage.trim(),
      created_by: adminUser.id,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rule })
}

// PATCH: toggle active, atau edit isi rule
export async function PATCH(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ruleId, active, triggerKeyword, replyMessage, dmMessage } = await req.json()
  if (!ruleId) return NextResponse.json({ error: 'ruleId wajib diisi' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (typeof active === 'boolean') updates.active = active
  if (typeof triggerKeyword === 'string') updates.trigger_keyword = triggerKeyword.trim()
  if (typeof replyMessage === 'string') updates.reply_message = replyMessage.trim()
  if (typeof dmMessage === 'string') updates.dm_message = dmMessage.trim()

  const supabase = getAdminSupabase()
  const { error } = await supabase.from('auto_dm_rules').update(updates).eq('id', ruleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE: hapus rule (?id=...)
export async function DELETE(req: NextRequest) {
  const adminUser = await assertAdmin(req)
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const ruleId = new URL(req.url).searchParams.get('id')
  if (!ruleId) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

  const supabase = getAdminSupabase()
  const { error } = await supabase.from('auto_dm_rules').delete().eq('id', ruleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
