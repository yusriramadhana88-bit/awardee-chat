import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { loadEnvKey } from '@/lib/env'
import { getAnthropic, SONNET_MODEL } from '@/lib/anthropic'
import { awardAchievement } from '@/lib/achievements-server'
import { canAccess } from '@/lib/tier'
import { ESSAY_TYPES, MAX_CHARS_PER_QUESTION, type AasEssayType } from '@/lib/aas-requirements'
import { buildEssayReviewSystemPrompt } from '@/lib/aas-ai'
import { checkAasReadyAchievement } from '@/lib/aas-achievements'
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

function profileContextString(profile: Record<string, unknown> | null, cvContext: string | null): string {
  if (!profile) return 'Pendaftar belum mengisi profil intake AAS Center — belum ada target studi untuk dicek konsistensinya.'
  return [
    `Kategori applicant: ${profile.applicant_category ?? '-'}`,
    `Jenjang: ${profile.jenjang ?? '-'}`,
    `Status kerja: ${profile.status_kerja ?? '-'}`,
    `Target kampus: ${profile.target_kampus ?? '-'}`,
    `Target program studi: ${profile.target_prodi ?? '-'}`,
    `Rencana kontribusi (dari intake): ${profile.rencana_kontribusi ?? '-'}`,
    cvContext ? `Ringkasan CV (dari CV Analyzer):\n${cvContext.slice(0, 3000)}` : 'CV belum dianalisis di CV Analyzer.',
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

    if (!canAccess(tier, 'starter')) {
      return NextResponse.json({ error: 'TIER_REQUIRED' }, { status: 403 })
    }

    const quota = await checkAiQuota(supabase, user.id, tier)
    if (!quota.allowed) {
      return NextResponse.json({ error: 'TIER_REQUIRED', usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr }, { status: 403 })
    }

    const body = await req.json()
    const essayType = body.essayType
    const answers = body.answers

    if (essayType !== 'kepemimpinan_dampak' && essayType !== 'rencana_reintegrasi') {
      return NextResponse.json({ error: 'Jenis esai tidak dikenali' }, { status: 400 })
    }

    const meta = ESSAY_TYPES[essayType as AasEssayType]

    if (!Array.isArray(answers) || answers.length !== meta.questions.length || answers.some((a) => typeof a !== 'string')) {
      return NextResponse.json({ error: 'Jawaban tidak lengkap' }, { status: 400 })
    }
    const overLimitIndex = (answers as string[]).findIndex((a) => a.length > MAX_CHARS_PER_QUESTION)
    if (overLimitIndex !== -1) {
      return NextResponse.json({ error: `Jawaban pertanyaan ${overLimitIndex + 1} melebihi batas resmi ${MAX_CHARS_PER_QUESTION} karakter.` }, { status: 400 })
    }
    const totalChars = (answers as string[]).reduce((sum, a) => sum + a.trim().length, 0)
    if (totalChars < 50) {
      return NextResponse.json({ error: 'Tulisan terlalu pendek. Minimal 50 karakter.' }, { status: 400 })
    }

    const content = meta.questions.map((q, i) => `${i + 1}. ${q}\n\n${(answers as string[])[i].trim()}`).join('\n\n')
    const charCount = totalChars

    const { data: aasProfile } = await supabase.from('aas_profiles').select('*').eq('user_id', user.id).maybeSingle()
    const { data: cvRow } = await supabase.from('cv_analyses').select('cv_content').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const profileContext = profileContextString(aasProfile, cvRow?.cv_content ?? null)
    const system = buildEssayReviewSystemPrompt(essayType as AasEssayType, profileContext)
    const userPrompt = `Jumlah karakter tiap jawaban (dihitung sistem, akurat, batas resmi ${MAX_CHARS_PER_QUESTION} karakter/pertanyaan): ${(answers as string[]).map((a, i) => `Q${i + 1}=${a.length}`).join(', ')}\n\nBerikut jawaban yang ditempel user:\n\n${content.slice(0, 16000)}`

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

          const { error: insertError } = await supabase.from('aas_essay_reviews').insert({
            user_id: user.id,
            essay_type: essayType,
            content: content.slice(0, 16000),
            answers,
            feedback,
            score,
          })
          if (insertError) throw new Error(`Insert gagal: ${insertError.message}`)

          const admin = getAdminSupabase()
          await logAiUsage(admin, user.id, 'aas', 'essay_review', SONNET_MODEL, finalMessage.usage.input_tokens, finalMessage.usage.output_tokens)
          await awardAchievement(admin, user.id, 'aas_first_essay')
          if (aasProfile) await checkAasReadyAchievement(supabase, admin, user.id, aasProfile)

          const quotaAfter = await checkAiQuota(supabase, user.id, tier)

          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'done', score, charCount, maxChars: meta.maxChars,
            usedIdr: quotaAfter.usedIdr, budgetIdr: quotaAfter.budgetIdr,
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
      .from('aas_essay_reviews')
      .select('essay_type, content, answers, feedback, score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const latestByType: Record<string, unknown> = {}
    for (const row of reviews ?? []) {
      if (!latestByType[row.essay_type]) latestByType[row.essay_type] = row
    }

    const quota = await checkAiQuota(supabase, user.id, tier)

    return NextResponse.json({ latest: latestByType, usedIdr: quota.usedIdr, budgetIdr: quota.budgetIdr })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
