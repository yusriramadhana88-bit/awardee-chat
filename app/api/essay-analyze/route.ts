import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getAnthropic, SONNET_MODEL } from '@/lib/anthropic'

function getSupabaseWithToken(token: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

const ESSAY_TYPE_LABEL: Record<string, string> = {
  personal_statement: 'Personal Statement',
  leadership: 'Leadership Essay',
  community_impact: 'Community Impact Statement',
  study_plan: 'Study Plan',
  motivation: 'Motivation Letter',
  other: 'Essay Beasiswa',
}

const ESSAY_SYSTEM_PROMPT = `Kamu adalah asisten kritik essay untuk pelamar beasiswa (AAS, LPDP, Chevening, GKS, dll), berdasarkan standar yang digunakan Den Dhana, mentor beasiswa di Awardee.id, dan metode khas "GALI DIRI" miliknya.

GALI DIRI artinya menggali profil penulis secara dalam dari sisi: pengalaman kerja & dampaknya, latar belakang pendidikan, pencapaian terukur, minat/passion, kontribusi ke komunitas, goals jangka pendek & panjang, dan keselarasan goals tersebut dengan goals Indonesia, negara tujuan, dan nilai sponsor beasiswa.

Tugasmu: berikan kritik MENDALAM dan SPESIFIK terhadap essay yang diberikan. Ini adalah fitur Essay Workshop berbayar (Pro) — jadi kamu BOLEH dan HARUS memberikan analisis paragraf-per-paragraf yang detail, bukan hanya pertanyaan reflektif seperti di chat biasa.

Format jawaban dengan struktur:

## Kesan Umum
Ringkasan kesan pertama terhadap essay ini — kekuatan dan kelemahan utama.

## Analisis Per Bagian
Untuk setiap paragraf/bagian utama, beri komentar spesifik: apa yang sudah kuat, apa yang masih generik atau kurang berdampak, dan pertanyaan kritis untuk menggali lebih dalam (metode GALI DIRI).

## Kesesuaian dengan Kriteria Beasiswa
Jika jenis essay/beasiswa diketahui, nilai seberapa essay ini menjawab apa yang dicari sponsor (future leader, community impact, kontribusi untuk Indonesia, dll).

## Saran Perbaikan Prioritas
3-5 saran paling penting untuk direvisi, urutkan dari paling kritis.

## Skor (1-10)
Skor kesiapan essay ini, dengan alasan singkat.

Aturan:
- Bahasa Indonesia, gunakan "aku" dan "kamu", nada hangat tapi jujur dan kritis
- Jangan menyebut "video", "transkrip", "AI training", atau sumber data apapun
- Tidak memberikan jaminan kelulusan
- Boleh menulis ulang KALIMAT CONTOH singkat untuk ilustrasi, tapi jangan menulis ulang seluruh essay`

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getSupabaseWithToken(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const tier = profile?.subscription_tier || 'free'
    if (tier !== 'vvip') {
      return NextResponse.json({ error: 'TIER_REQUIRED' }, { status: 403 })
    }

    const { draftId, content, essayType } = await req.json()
    if (!draftId || !content || typeof content !== 'string' || content.trim().length < 100) {
      return NextResponse.json({ error: 'Essay terlalu pendek. Minimal 100 karakter.' }, { status: 400 })
    }

    const typeLabel = ESSAY_TYPE_LABEL[essayType] || 'Essay Beasiswa'
    const userPrompt = `Jenis essay: ${typeLabel}\n\nBerikut isi essay-nya:\n\n${content.slice(0, 16000)}`

    const response = await getAnthropic().messages.create({
      model: SONNET_MODEL,
      max_tokens: 3072,
      system: ESSAY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const feedback = response.content[0].type === 'text' ? response.content[0].text : ''
    const reviewedAt = new Date().toISOString()
    const scoreMatch = feedback.match(/(\d{1,2})\/10/)
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null

    await supabase
      .from('essay_drafts')
      .update({ ai_feedback: feedback, reviewed_at: reviewedAt, content, updated_at: reviewedAt, score })
      .eq('id', draftId)
      .eq('user_id', user.id)

    return NextResponse.json({ feedback, score, reviewed_at: reviewedAt })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal menganalisis essay. Coba lagi ya.' }, { status: 500 })
  }
}
