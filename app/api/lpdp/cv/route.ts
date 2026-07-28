import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { detectFileType, uploadEncrypted, extractDocxText, MAX_FILE_BYTES } from '@/lib/lpdp-files'

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

// Upload CV (.docx saja) khusus konteks LPDP Center — teks CV disimpan ke lpdp_profiles.cv_text
// supaya Review Esai bisa mengecek konsistensi esai dengan latar belakang user.
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File CV wajib diisi' }, { status: 400 })
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 400 })
    }
    if (detectFileType(file.type) !== 'docx') {
      return NextResponse.json({ error: 'CV hanya menerima file Word (.docx)' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const cvText = await extractDocxText(buf)
    if (cvText.trim().length < 50) {
      return NextResponse.json({ error: 'Teks CV terlalu pendek atau gagal diekstrak dari file ini.' }, { status: 400 })
    }

    const admin = getAdminSupabase()
    const storagePath = `${user.id}/cv/${Date.now()}.enc`
    await uploadEncrypted(admin, storagePath, buf)

    const { error } = await supabase.from('lpdp_profiles').upsert({
      user_id: user.id,
      cv_text: cvText.slice(0, 12000),
      cv_storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, preview: cvText.slice(0, 300) })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal memproses CV. Coba lagi ya.' }, { status: 500 })
  }
}
