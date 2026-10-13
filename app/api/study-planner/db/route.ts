import { NextRequest, NextResponse } from 'next/server'
import { loadEnvKey } from '@/lib/env'
import { studyPlannerBuyUrl } from '@/lib/study-planner/buy'
import { getStudyPlannerAccess } from '@/lib/study-planner/access'
import { meta, searchPrograms, searchScholarships } from '@/lib/study-planner/db'

// Database lengkap Study Planner — hanya untuk pembeli (atau admin). Tanpa akses -> 403 + info pembelian.
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const acc = await getStudyPlannerAccess(token)
  if (acc.reason === 'unauth') return NextResponse.json({ error: 'Belum login' }, { status: 401 })
  if (!acc.ok) {
    return NextResponse.json({
      error: 'Belum punya akses', buyUrl: studyPlannerBuyUrl(), email: acc.email ?? '',
      waNumber: loadEnvKey('STUDY_PLANNER_WA_NUMBER') || '6281287212755',
    }, { status: 403 })
  }

  const q = req.nextUrl.searchParams
  const num = (k: string) => { const v = q.get(k); const n = v ? Number(v) : NaN; return Number.isFinite(n) ? n : undefined }
  const mode = q.get('mode')
  if (mode === 'meta') return NextResponse.json(meta())
  if (mode === 'scholarships') {
    return NextResponse.json(searchScholarships({ level: q.get('level') ?? 'pg', q: q.get('q') ?? '', uni: num('uni'), page: num('page') }))
  }
  return NextResponse.json(searchPrograms({
    level: q.get('level') ?? 's2', q: (q.get('q') ?? '').slice(0, 100), topic: q.get('topic') ?? undefined, city: q.get('city') ?? undefined,
    uni: num('uni'), aas: q.get('aas') === '1', maxIelts: num('maxIelts'), maxTuition: num('maxTuition'), sort: q.get('sort') ?? 'rank', page: num('page'),
  }))
}
