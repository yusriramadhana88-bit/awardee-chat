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
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
