import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { userId, phone } = await req.json()
    if (!userId || !phone) return NextResponse.json({ ok: false })

    const supabase = getSupabaseAdmin()

    // Cek duplikat sekali lagi (server-side guard)
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .neq('id', userId)
      .maybeSingle()

    if (existing) {
      // Hapus auth user yang baru dibuat agar tidak jadi ghost account
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ ok: false, error: 'phone_taken' }, { status: 409 })
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, phone }, { onConflict: 'id' })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
