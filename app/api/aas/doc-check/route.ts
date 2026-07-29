import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'
import { loadEnvKey } from '@/lib/env'
import { getAnthropic, SONNET_MODEL } from '@/lib/anthropic'
import { awardAchievement } from '@/lib/achievements-server'
import { canAccess } from '@/lib/tier'
import { AAS_DOCS } from '@/lib/aas-requirements'
import { detectFileType, uploadEncrypted, extractDocxText, MAX_FILE_BYTES } from '@/lib/aas-files'
import { buildDocCheckSystemPrompt, extractJson } from '@/lib/aas-ai'
import { checkAasDocsClearAchievement, checkAasReadyAchievement } from '@/lib/aas-achievements'
import { checkAiQuota, logAiUsage } from '@/lib/ai-quota'

export const maxDuration = 60

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

type DocCheckResult = {
  verdict: 'sesuai' | 'perlu_perbaikan' | 'tidak_sesuai'
  skor: number | null
  temuan: string[]
  komentar: string
}

function fallbackResult(): DocCheckResult {
  return {
    verdict: 'perlu_perbaikan',
    skor: null,
    temuan: ['Sistem kesulitan membaca hasil analisis otomatis — coba upload ulang, atau tanya langsung di chat AAS.'],
    komentar: 'Ada gangguan pas membaca hasilnya. Coba upload ulang ya, kalau masih gagal chat tim Awardee.id langsung.',
  }
}

function profileContextString(profile: Record<string, unknown> | null): string {
  if (!profile) return 'Pendaftar belum mengisi profil intake AAS Center.'
  return [
    `Kategori applicant: ${profile.applicant_category ?? '-'}`,
    `Jenjang: ${profile.jenjang ?? '-'}`,
    `Status kerja: ${profile.status_kerja ?? '-'}`,
    `Target kampus: ${profile.target_kampus ?? '-'}`,
    `Target program studi: ${profile.target_prodi ?? '-'}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get('content-length') ?? '0')
    if (contentLength > MAX_FILE_BYTES + 100_000) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 400 })
    }

    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profileRow } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
    const tier = profileRow?.subscription_tier || 'free'

    if (!canAccess(tier, 'starter')) {
      return NextResponse.json({ error: 'TIER_REQUIRED' }, { status: 403 })
    }

    const quota = await checkAiQuota(supabase, user.id, tier)
    if (!quota.allowed) {
      return NextResponse.json({ error: 'TIER_REQUIRED', usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const docKey = formData.get('docKey')
    if (!(file instanceof File) || typeof docKey !== 'string') {
      return NextResponse.json({ error: 'File dan docKey wajib diisi' }, { status: 400 })
    }

    const doc = AAS_DOCS.find((d) => d.key === docKey)
    if (!doc) return NextResponse.json({ error: 'Dokumen tidak dikenali' }, { status: 400 })

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 400 })
    }

    const fileType = detectFileType(file.type)
    if (!fileType || !doc.acceptedTypes.includes(fileType)) {
      return NextResponse.json({ error: `Format tidak didukung untuk dokumen ini. AAS hanya menerima: ${doc.acceptedTypes.join(', ')}` }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())

    const { data: aasProfile } = await supabase.from('aas_profiles').select('*').eq('user_id', user.id).maybeSingle()
    const profileContext = profileContextString(aasProfile)

    const system = buildDocCheckSystemPrompt(doc, profileContext)

    let userContent: string | Anthropic.Messages.ContentBlockParam[]
    if (fileType === 'docx') {
      const text = await extractDocxText(buf)
      userContent = `Berikut isi dokumen (diekstrak dari Word — ingat: format Word cuma untuk review, OASIS asli tidak menerima ini):\n\n${text.slice(0, 16000)}`
    } else if (fileType === 'pdf') {
      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } },
        { type: 'text', text: 'Berikut dokumen yang diunggah user untuk dicek.' },
      ]
    } else {
      const mediaType = fileType === 'jpg' ? 'image/jpeg' : 'image/png'
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') } },
        { type: 'text', text: 'Berikut dokumen (foto/scan) yang diunggah user untuk dicek.' },
      ]
    }

    const response = await getAnthropic().messages.create({
      model: SONNET_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userContent }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = extractJson<Partial<DocCheckResult>>(rawText)
    const result: DocCheckResult = parsed && parsed.verdict && parsed.komentar
      ? {
          verdict: parsed.verdict,
          skor: typeof parsed.skor === 'number' ? parsed.skor : null,
          temuan: Array.isArray(parsed.temuan) ? parsed.temuan.map(String) : [],
          komentar: parsed.komentar,
        }
      : fallbackResult()

    const admin = getAdminSupabase()
    const storagePath = `${user.id}/${docKey}/${Date.now()}.enc`
    await uploadEncrypted(admin, storagePath, buf)

    const { error: insertError } = await supabase.from('aas_doc_checks').insert({
      user_id: user.id,
      doc_key: docKey,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      verdict: result.verdict,
      skor: result.skor,
      temuan: result.temuan,
      komentar: result.komentar,
    })
    if (insertError) throw new Error(`Insert gagal: ${insertError.message}`)

    await logAiUsage(admin, user.id, 'aas', 'doc_check', SONNET_MODEL, response.usage.input_tokens, response.usage.output_tokens)
    await awardAchievement(admin, user.id, 'aas_first_doc')
    if (aasProfile) {
      await checkAasDocsClearAchievement(supabase, admin, user.id, aasProfile)
      await checkAasReadyAchievement(supabase, admin, user.id, aasProfile)
    }

    const quotaAfter = await checkAiQuota(supabase, user.id, tier)

    return NextResponse.json({ ...result, usedIdr: quotaAfter.usedIdr, budgetIdr: quotaAfter.budgetIdr })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal memverifikasi dokumen. Coba lagi ya.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profileRow } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single()
    const tier = profileRow?.subscription_tier || 'free'

    const { data: checks } = await supabase
      .from('aas_doc_checks')
      .select('doc_key, verdict, skor, komentar, temuan, file_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const latestByDocKey: Record<string, unknown> = {}
    for (const row of checks ?? []) {
      if (!latestByDocKey[row.doc_key]) latestByDocKey[row.doc_key] = row
    }

    const quota = await checkAiQuota(supabase, user.id, tier)

    return NextResponse.json({ latest: latestByDocKey, usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
