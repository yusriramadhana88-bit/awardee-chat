import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'
import { loadEnvKey } from '@/lib/env'
import { getAnthropic, SONNET_MODEL } from '@/lib/anthropic'
import { awardAchievement } from '@/lib/achievements-server'
import { LPDP_DOCS } from '@/lib/lpdp-requirements'
import { detectFileType, uploadEncrypted, extractDocxText, MAX_FILE_BYTES, WARN_FILE_BYTES } from '@/lib/lpdp-files'
import { buildDocCheckSystemPrompt, extractJson } from '@/lib/lpdp-ai'
import { checkLpdpDocsClearAchievement, checkLpdpReadyAchievement } from '@/lib/lpdp-achievements'
import { checkLpdpQuota, logLpdpUsage } from '@/lib/lpdp-quota'

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
    temuan: ['Sistem kesulitan membaca hasil analisis otomatis — coba upload ulang, atau tanya langsung di chat LPDP.'],
    komentar: 'Ada gangguan pas membaca hasilnya. Coba upload ulang ya, kalau masih gagal chat tim Awardee.id langsung.',
  }
}

function profileContextString(profile: Record<string, unknown> | null): string {
  if (!profile) return 'Pendaftar belum mengisi profil intake LPDP Center.'
  return [
    `Jenjang: ${profile.jenjang ?? '-'}`,
    `Tujuan studi: ${profile.tujuan ?? '-'}`,
    `Sudah punya LoA: ${profile.punya_loa ? 'Ya' : 'Tidak'}`,
    `LoA Unconditional: ${profile.loa_unconditional ? 'Ya' : 'Tidak'}`,
    `Status kerja: ${profile.status_kerja ?? '-'}`,
    `Lulusan luar negeri (jenjang sebelumnya): ${profile.lulusan_luar_negeri ? 'Ya' : 'Tidak'}`,
    `Pernah studi tidak lulus / on-going pindah program: ${profile.pernah_gagal_studi ? 'Ya' : 'Tidak'}`,
    `Skema Pendanaan Parsial: ${profile.pendanaan_parsial ? 'Ya' : 'Tidak'}`,
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

    const quota = await checkLpdpQuota(supabase, user.id, tier)
    if (!quota.allowed) {
      return NextResponse.json({ error: 'TIER_REQUIRED', usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file')
    const docKey = formData.get('docKey')
    if (!(file instanceof File) || typeof docKey !== 'string') {
      return NextResponse.json({ error: 'File dan docKey wajib diisi' }, { status: 400 })
    }

    const doc = LPDP_DOCS.find((d) => d.key === docKey)
    if (!doc) return NextResponse.json({ error: 'Dokumen tidak dikenali' }, { status: 400 })

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 400 })
    }

    const fileType = detectFileType(file.type)
    if (!fileType || !doc.acceptedTypes.includes(fileType)) {
      return NextResponse.json({ error: `Format tidak didukung untuk dokumen ini. Terima: ${doc.acceptedTypes.join(', ')}` }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())

    const { data: lpdpProfile } = await supabase.from('lpdp_profiles').select('*').eq('user_id', user.id).maybeSingle()
    const profileContext = profileContextString(lpdpProfile)
    const sizeNote = file.size > WARN_FILE_BYTES
      ? `\n\nCatatan sistem: ukuran file ${(file.size / (1024 * 1024)).toFixed(1)}MB — cukup besar, portal LPDP kadang menolak file besar walau batas resminya tidak disebutkan di buku panduan. Ingatkan user untuk kompres/scan ulang kalau perlu.`
      : ''

    const system = buildDocCheckSystemPrompt(doc, profileContext)

    let userContent: string | Anthropic.Messages.ContentBlockParam[]
    if (fileType === 'docx') {
      const text = await extractDocxText(buf)
      userContent = `Berikut isi dokumen (diekstrak dari Word):\n\n${text.slice(0, 16000)}${sizeNote}`
    } else if (fileType === 'pdf') {
      userContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } },
        { type: 'text', text: `Berikut dokumen yang diunggah user untuk dicek.${sizeNote}` },
      ]
    } else {
      const mediaType = fileType === 'jpg' ? 'image/jpeg' : 'image/png'
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: buf.toString('base64') } },
        { type: 'text', text: `Berikut dokumen (foto/scan) yang diunggah user untuk dicek.${sizeNote}` },
      ]
    }

    const response = await getAnthropic().messages.create({
      model: SONNET_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: userContent }],
    })

    const admin = getAdminSupabase()
    await logLpdpUsage(admin, user.id, 'doc_check', SONNET_MODEL, response.usage.input_tokens, response.usage.output_tokens)

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

    const storagePath = `${user.id}/${docKey}/${Date.now()}.enc`
    await uploadEncrypted(admin, storagePath, buf)

    await supabase.from('lpdp_doc_checks').insert({
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

    await awardAchievement(admin, user.id, 'lpdp_first_doc')
    if (lpdpProfile) {
      await checkLpdpDocsClearAchievement(supabase, admin, user.id, lpdpProfile)
      await checkLpdpReadyAchievement(supabase, admin, user.id, lpdpProfile)
    }

    const quotaAfter = await checkLpdpQuota(supabase, user.id, tier)

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
      .from('lpdp_doc_checks')
      .select('doc_key, verdict, skor, komentar, temuan, file_name, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const latestByDocKey: Record<string, unknown> = {}
    for (const row of checks ?? []) {
      if (!latestByDocKey[row.doc_key]) latestByDocKey[row.doc_key] = row
    }

    const quota = await checkLpdpQuota(supabase, user.id, tier)

    return NextResponse.json({
      usedIdr: quota.usedIdr,
      budgetIdr: quota.budgetIdr,
      latest: latestByDocKey,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
