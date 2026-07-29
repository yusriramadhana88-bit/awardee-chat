import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadMagnetEmail } from '@/lib/email'
import { pickRandomLeadMagnet } from '@/lib/lead-magnets'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name, referralId } = await req.json()
    if (!userId) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    // Bonus pendaftaran: semua akun baru = tier free (upgrade terjadi manual belakangan),
    // jadi kirim lead magnet begitu registrasi selesai — gagal kirim tidak menggagalkan registrasi.
    if (email) {
      await sendLeadMagnetEmail(email, name || 'Sobat Awardee', pickRandomLeadMagnet())
    }

    // Attach klik referral (kalau ada) ke akun baru ini — row referrals dibuat saat klik
    // link (lihat /api/affiliate/click), referee_user_id masih kosong sampai di sini.
    if (referralId) {
      await supabase.from('referrals').update({ referee_user_id: userId }).eq('id', referralId).is('referee_user_id', null)
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
