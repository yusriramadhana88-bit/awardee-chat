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

// Batas analisis CV per bulan
const MONTHLY_LIMITS: Record<string, number> = { free: 0, starter: 0, vip: 3, vvip: 999 }

const CV_SYSTEM_PROMPT = `Kamu adalah asisten analisis CV untuk pelamar beasiswa (AAS, LPDP, Chevening, GKS, dan beasiswa lainnya), berbasis standar yang digunakan Den Dhana, mentor beasiswa di Awardee.id.

Tugasmu: analisis CV yang diberikan client dan berikan penilaian JUJUR, KRITIS, DAN KONSTRUKTIF.

Format jawaban dengan struktur berikut (gunakan markdown sederhana):

## Ringkasan Profil
Ringkas singkat siapa kandidat ini berdasarkan CV.

## Kekuatan
Poin-poin kekuatan utama yang relevan untuk aplikasi beasiswa (leadership, dampak komunitas, akademik, dll).

## Area yang Perlu Diperkuat
Poin-poin spesifik yang lemah atau kurang menonjol — sebutkan KENAPA itu jadi masalah untuk penilai beasiswa.

## Rekomendasi Konkret
Saran spesifik dan actionable untuk memperbaiki/memperkuat CV — bukan saran generik.

## Skor Kesiapan (1-10)
Beri skor 1-10 untuk kesiapan CV ini diajukan ke beasiswa, dengan alasan singkat.

Aturan:
- Bahasa Indonesia, gunakan "aku" dan "kamu"
- Jujur dan tidak memberi false hope, tapi tetap suportif
- Jangan menyebut "video", "transkrip", atau sumber AI/data apapun
- Jika target beasiswa disebutkan, sesuaikan kriteria penilaian dengan apa yang dicari beasiswa tersebut (AAS: future leader & community impact; LPDP: kontribusi untuk Indonesia; dll)
- Tidak memberikan jaminan kelulusan`

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
    const limit = MONTHLY_LIMITS[tier] ?? 0

    if (limit <= 0) {
      return NextResponse.json({ error: 'TIER_REQUIRED' }, { status: 403 })
    }

    // Hitung pemakaian bulan ini
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('cv_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: 'LIMIT_REACHED', limit }, { status: 429 })
    }

    const { cvContent, targetScholarship } = await req.json()
    if (!cvContent || typeof cvContent !== 'string' || cvContent.trim().length < 50) {
      return NextResponse.json({ error: 'CV terlalu pendek. Minimal 50 karakter.' }, { status: 400 })
    }

    const userPrompt = targetScholarship
      ? `Target beasiswa: ${targetScholarship}\n\nBerikut CV-nya:\n\n${cvContent.slice(0, 12000)}`
      : `Berikut CV-nya:\n\n${cvContent.slice(0, 12000)}`

    const response = await getAnthropic().messages.create({
      model: SONNET_MODEL,
      max_tokens: 2048,
      system: CV_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const analysis = response.content[0].type === 'text' ? response.content[0].text : ''
    const scoreMatch = analysis.match(/(\d{1,2})\/10/)
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null

    await supabase.from('cv_analyses').insert({
      user_id: user.id,
      cv_content: cvContent.slice(0, 12000),
      target_scholarship: targetScholarship || null,
      analysis,
      score,
    })

    return NextResponse.json({ analysis, score, used: (count ?? 0) + 1, limit })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Gagal menganalisis CV. Coba lagi ya.' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
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
    const limit = MONTHLY_LIMITS[tier] ?? 0

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const [{ count }, { data: history }] = await Promise.all([
      supabase
        .from('cv_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('cv_analyses')
        .select('id, target_scholarship, analysis, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    return NextResponse.json({ used: count ?? 0, limit, history: history || [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
