// Database lengkap Study Planner (produk berbayar). Hanya dipanggil dari API yang sudah memeriksa hak akses.
/* eslint-disable @typescript-eslint/no-var-requires */
type Uni = { n: string; pv: string; k: number; ug: number[] | null; pg: number[] | null; hdr: number[] | null; qs?: any; the?: any; aas?: number; sch?: any }
type Data = { occ: any[]; topics: string[]; levels: string[]; unis: Uni[]; rows: any[][]; built: string; snapshot: string }
type Sch = { id: string; n: string; p: string[]; l: string[]; a: number | null; m: number | null; ac: string | string[] | null; np: number | null; cl: string | null; e: string; c: string | string[] | null; f: string[] | null; r: boolean | null; u: string | null }

const D = require('./data.json') as Data
const SCH = require('./scholarships.json') as Sch[]

const TOPIC_LABEL: Record<string, string> = { hosp: 'Perhotelan & pariwisata', trade: 'Teknik vokasi', care: 'Perawatan & kesejahteraan', creative: 'Seni & desain', beauty: 'Kecantikan', sport: 'Olahraga & kebugaran', policy: 'Kebijakan publik', dev: 'Pembangunan internasional', biz: 'Bisnis & manajemen', fin: 'Keuangan & ekonomi', it: 'Teknologi informasi & data', eng: 'Teknik & rekayasa', energy: 'Energi', health: 'Kesehatan', pubhealth: 'Kesehatan masyarakat', edu: 'Pendidikan', env: 'Lingkungan & keberlanjutan', agri: 'Pertanian & pangan', marine: 'Kelautan', law: 'Hukum', social: 'Ilmu sosial & komunikasi', mat: 'Material & manufaktur', mining: 'Pertambangan & sumber daya', sci: 'Sains', plan: 'Perencanaan & arsitektur', transport: 'Transportasi & logistik' }
const LEVEL_LABEL: Record<string, string> = { d1: 'D1 / Certificate', d3: 'D3 / Diploma', s1: 'S1 / Bachelor', s2: 'S2 / Master', s3: 'S3 / Doktor' }
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const uniByPv = new Map<string, number>()
D.unis.forEach((u, i) => uniByPv.set(u.pv, i))
const pvSch = new Map<string, number>()   // jumlah beasiswa pascasarjana per kampus
SCH.forEach((s) => { if (s.l.includes('pg')) s.p.forEach((pv) => pvSch.set(pv, (pvSch.get(pv) ?? 0) + 1)) })

const rank = (r: any) => (r && r.rank_n != null ? Number(r.rank_n) : null)
const lc = (s: string) => s.toLowerCase()

export function meta() {
  const cities = new Map<string, number>()
  D.rows.forEach((r) => (r[5] || []).forEach((c: string) => cities.set(c, (cities.get(c) ?? 0) + 1)))
  const perLevel: Record<string, number> = {}
  D.rows.forEach((r) => { const l = D.levels[r[13]]; perLevel[l] = (perLevel[l] ?? 0) + 1 })
  return {
    levels: D.levels.map((l) => ({ key: l, label: LEVEL_LABEL[l], count: perLevel[l] ?? 0 })),
    topics: D.topics.map((t) => ({ key: t, label: TOPIC_LABEL[t] ?? t })),
    cities: Array.from(cities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([c]) => c),
    unis: D.unis.map((u, i) => ({ i, n: u.n, k: u.k, aas: !!u.aas })).sort((a, b) => a.n.localeCompare(b.n)),
    stats: { programs: D.rows.length, institutions: D.unis.length, universities: D.unis.filter((u) => u.k === 2).length, scholarships: SCH.filter((s) => s.l.includes('pg')).length, snapshot: D.snapshot, built: D.built },
  }
}

function reqIelts(row: any[]): { overall: number; band: number | null; src: 'program' | 'kampus' } | null {
  const u = D.unis[row[0]], lv = D.levels[row[13]]
  if (row[8]) return { overall: row[8], band: null, src: 'program' }
  const r = lv === 's2' ? u.pg : lv === 's3' ? u.hdr : u.ug
  return r ? { overall: r[0], band: r[1] ?? null, src: 'kampus' } : null
}

function decode(row: any[], i: number) {
  const u = D.unis[row[0]], months: string[] = []
  for (let m = 1; m <= 12; m++) if ((row[10] >> (m - 1)) & 1) months.push(BULAN[m - 1])
  const w: number | null = row[3] || null, t: number | null = row[4] >= 500 ? row[4] : null   // nilai < 500 = data tidak valid
  const topics = D.topics.filter((_, k) => (row[6] >> k) & 1).map((t) => TOPIC_LABEL[t] ?? t)
  return {
    id: i, name: row[2], level: D.levels[row[13]], codes: row[1] as string[], providerCode: row[11], url: row[9], urlType: row[14] === 0 ? 'universitas' : 'register CRICOS',
    uni: { i: row[0], name: u.n, curated: u.k === 2, aas: !!u.aas, qs: u.qs ? { rank: u.qs.rank } : null, the: u.the ? { rank: u.the.rank } : null, intlPct: u.the?.intl_pct ?? null },
    cities: (row[5] || []) as string[], weeks: w, years: w ? Math.round((w / 52) * 2) / 2 : null,
    tuitionTotal: t, tuitionPerYear: t && w && w >= 45 ? Math.round(t / (w / 52) / 100) * 100 : null,
    ielts: reqIelts(row), intakes: months, intakeFromData: !!row[15], topics,
    priority: !!row[7],
    careers: ((row[16] || []) as number[]).slice(0, 3).map((k) => { const o = D.occ[k]; return { title: o[2] || o[1], medianWeekly: o[3] || null } }),
    schCount: pvSch.get(row[11]) ?? 0,
  }
}

export type SearchParams = { level?: string; q?: string; topic?: string; city?: string; uni?: number; aas?: boolean; maxIelts?: number; maxTuition?: number; sort?: string; page?: number }

export function searchPrograms(p: SearchParams) {
  const li = p.level ? D.levels.indexOf(p.level) : 3
  const tIdx = p.topic ? D.topics.indexOf(p.topic) : -1
  const toks = lc(p.q ?? '').split(/\s+/).filter((x) => x.length > 1).slice(0, 6)
  const out: number[] = []
  D.rows.forEach((r, i) => {
    if (li >= 0 && r[13] !== li) return
    if (tIdx >= 0 && !((r[6] >> tIdx) & 1)) return
    if (p.city && !(r[5] || []).includes(p.city)) return
    if (p.uni != null && r[0] !== p.uni) return
    const u = D.unis[r[0]]
    if (p.aas && !u.aas) return
    if (p.maxTuition && (!(r[4] >= 500) || r[4] > p.maxTuition)) return
    if (p.maxIelts) { const q = reqIelts(r); if (!q || q.overall > p.maxIelts) return }
    if (toks.length) { const name = lc(r[2] + ' ' + u.n); if (!toks.every((t) => name.includes(t))) return }
    out.push(i)
  })
  const sort = p.sort || 'rank'
  const qsr = (i: number) => rank(D.unis[D.rows[i][0]].qs) ?? 9999
  const the = (i: number) => rank(D.unis[D.rows[i][0]].the) ?? 9999
  out.sort((a, b) => {
    if (sort === 'tuition') return (D.rows[a][4] >= 500 ? D.rows[a][4] : 1e9) - (D.rows[b][4] >= 500 ? D.rows[b][4] : 1e9) || qsr(a) - qsr(b)
    if (sort === 'name') return D.rows[a][2].localeCompare(D.rows[b][2])
    const ra = Math.min(qsr(a), the(a)), rb = Math.min(qsr(b), the(b))
    return ra - rb || D.rows[a][2].localeCompare(D.rows[b][2])
  })
  const per = 20, page = Math.max(1, Math.min(p.page || 1, Math.ceil(out.length / per) || 1))
  return { total: out.length, page, perPage: per, rows: out.slice((page - 1) * per, page * per).map((i) => decode(D.rows[i], i)) }
}

export type SchParams = { level?: string; q?: string; uni?: number; page?: number }

export function searchScholarships(p: SchParams) {
  const lv = p.level === 'ug' ? 'ug' : 'pg'
  const toks = lc(p.q ?? '').split(/\s+/).filter((x) => x.length > 1).slice(0, 6)
  const pv = p.uni != null && D.unis[p.uni] ? D.unis[p.uni].pv : null
  const list = SCH.filter((s) => {
    if (!s.l.includes(lv)) return false
    if (pv && !s.p.includes(pv)) return false
    if (toks.length) { const hay = lc(s.n + ' ' + s.e + ' ' + s.p.map((c) => D.unis[uniByPv.get(c) ?? -1]?.n ?? '').join(' ')); if (!toks.every((t) => hay.includes(t))) return false }
    return true
  }).sort((a, b) => (b.a ?? b.m ?? 0) - (a.a ?? a.m ?? 0))
  const per = 20, page = Math.max(1, Math.min(p.page || 1, Math.ceil(list.length / per) || 1))
  return {
    total: list.length, page, perPage: per,
    rows: list.slice((page - 1) * per, page * per).map((s) => ({
      id: s.id, name: s.n, unis: s.p.map((c) => D.unis[uniByPv.get(c) ?? -1]?.n).filter(Boolean), amountAnnual: s.a, amountMax: s.m, amountNote: s.ac,
      perYear: s.np, closing: s.cl, eligibility: s.e, citizenship: Array.isArray(s.c) ? (s.c.length ? s.c.join(', ') : null) : (s.c || null), researchOnly: !!s.r, url: s.u,
    })),
  }
}
