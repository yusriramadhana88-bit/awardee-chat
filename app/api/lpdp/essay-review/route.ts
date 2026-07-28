import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { getAnthropic, SONNET_MODEL } from '@/lib/anthropic'
import { awardAchievement } from '@/lib/achievements-server'
import { ESSAY_TYPES, type LpdpEssayType } from '@/lib/lpdp-requirements'
import { detectFileType, uploadEncrypted, extractDocxText, MAX_FILE_BYTES } from '@/lib/lpdp-files'
import { buildEssayReviewSystemPrompt } from '@/lib/lpdp-ai'
import { checkLpdpReadyAchievement } from '@/lib/lpdp-achievements'
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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function profileContextString(profile: Record<string, unknown> | null): string {
  if (!profile) return 'Pendaftar belum mengisi profil intake LPDP Center — belum ada CV/target studi untuk dicek konsistensinya.'
  return [
    `Jenjang: ${profile.jenjang ?? '-'}`,
    `Tujuan studi: ${profile.tujuan ?? '-'}`,
    `Target kampus: ${profile.target_kampus ?? '-'}`,
    `Target program studi: ${profile.target_prodi ?? '-'}`,
    `Rencana kontribusi (dari intake): ${profile.rencana_kontribusi ?? '-'}`,
    profile.cv_text ? `Ringkasan CV:\n${String(profile.cv_text).slice(0, 3000)}` : 'CV belum diunggah.',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  try {
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

    const contentType = req.headers.get('content-type') ?? ''
    let essayType: string
    let content: string
    let storagePath: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file')
      const essayTypeField = formData.get('essayType')
      if (!(file instanceof File) || typeof essayTypeField !== 'string') {
        return NextResponse.json({ error: 'File dan essayType wajib diisi' }, { status: 400 })
      }
      essayType = essayTypeField
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'FILE_TOO_LARGE', maxBytes: MAX_FILE_BYTES }, { status: 400 })
      }
      const fileType = detectFileType(file.type)
      if (fileType !== 'docx') {
        return NextResponse.json({ error: 'Esai/Profil Diri hanya menerima file Word (.docx)' }, { status: 400 })
      }
      const buf = Buffer.from(await file.arrayBuffer())
      content = await extractDocxText(buf)
      const admin = getAdminSupabase()
      storagePath = `${user.id}/${essayType}/${Date.now()}.enc`
      await uploadEncrypted(admin, storagePath, buf)
    } else {
      const body = await req.json()
      essayType = body.essayType
      content = body.content
    }

    if (essayType !== 'profil_diri' && essayType !== 'esai_komitmen') {
      return NextResponse.json({ error: 'Jenis esai tidak dikenali' }, { status: 400 })
    }
    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return NextResponse.json({ error: 'Tulisan terlalu pendek. Minimal 50 karakter.' }, { status: 400 })
    }

    const wordCount = countWords(content)
    const { data: lpdpProfile } = await supabase.from('lpdp_profiles').select('*').eq('user_id', user.id).maybeSingle()
    const profileContext = profileContextString(lpdpProfile)
    const system = buildEssayReviewSystemPrompt(essayType as LpdpEssayType, profileContext)
    const userPrompt = `Jumlah kata (dihitung sistem, akurat): ${wordCount} kata\n\nBerikut isi tulisannya:\n\n${content.slice(0, 16000)}`

    // Streaming (bukan sekadar UX) — respons panjang (handbook context besar + max_tokens tinggi)
    // bisa melebihi idle-timeout jaringan edge Vercel kalau dikirim sebagai satu blok JSON di akhir.
    // NDJSON: baris {"type":"delta",...} selama teks mengalir, ditutup {"type":"done",...}/{"type":"error",...}.
    const encoder = new TextEncoder()
    const stream = getAnthropic().messages.stream({
      model: SONNET_MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        stream.on('text', (delta) => {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'))
        })
        try {
          const finalMessage = await stream.finalMessage()
          const feedback = finalMessage.content[0]?.type === 'text' ? finalMessage.content[0].text : ''
          const scoreMatch = feedback.match(/(\d{1,2})\/10/)
          const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null

          const admin = getAdminSupabase()
          await logLpdpUsage(admin, user.id, 'essay_review', SONNET_MODEL, finalMessage.usage.input_tokens, finalMessage.usage.output_tokens)

          const { error: insertError } = await supabase.from('lpdp_essay_reviews').insert({
            user_id: user.id,
            essay_type: essayType,
            content: content.slice(0, 16000),
            feedback,
            score,
            storage_path: storagePath,
          })
          if (insertError) throw new Error(`Insert gagal: ${insertError.message}`)

          await awardAchievement(admin, user.id, 'lpdp_first_essay')
          if (lpdpProfile) await checkLpdpReadyAchievement(supabase, admin, user.id, lpdpProfile)

          const quotaAfter = await checkLpdpQuota(supabase, user.id, tier)

          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done', score, wordCount,
            wordRange: ESSAY_TYPES[essayType as LpdpEssayType],
            usedIdr: quotaAfter.usedIdr,
            budgetIdr: quotaAfter.budgetIdr,
          }) + '\n'))
        } catch (error) {
          console.error('Error:', error)
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: 'Gagal mereview tulisan. Coba lagi ya.' }) + '\n'))
        } finally {
          controller.close()
        }
      },
    })

    return new NextResponse(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' } })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal mereview tulisan. Coba lagi ya.' }, { status: 500 })
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

    const { data: reviews } = await supabase
      .from('lpdp_essay_reviews')
      .select('essay_type, content, feedback, score, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const latestByType: Record<string, unknown> = {}
    for (const row of reviews ?? []) {
      if (!latestByType[row.essay_type]) latestByType[row.essay_type] = row
    }

    const quota = await checkLpdpQuota(supabase, user.id, tier)

    return NextResponse.json({
      usedIdr: quota.usedIdr,
      budgetIdr: quota.budgetIdr,
      latest: latestByType,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
