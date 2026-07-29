import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { checkAiQuota } from '@/lib/ai-quota'

function getSupabaseWithToken(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

// Endpoint ringan khusus kuota AI (dipakai header dashboard) — tidak ikut narik riwayat
// esai/dokumen seperti GET /api/aas|lpdp/essay-review, supaya cepat dipanggil di tiap halaman.
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profileRow } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
    const tier = profileRow?.subscription_tier || 'free'

    const quota = await checkAiQuota(supabase, user.id, tier)

    return NextResponse.json({ tier, usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
