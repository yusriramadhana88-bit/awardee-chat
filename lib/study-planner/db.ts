// Database lengkap Study Planner (produk berbayar). Hanya dipanggil dari API yang sudah memeriksa hak akses.
/* eslint-disable @typescript-eslint/no-var-requires */
type Uni = { n: string; pv: string; k: number; ug: number[] | null; pg: number[] | null; hdr: number[] | null; qs?: any; the?: any; aas?: number; sch?: any }
type Data = { occ: any[]; topics: string[]; levels: string[]; unis: Uni[]; rows: any[][]; built: string; snapshot: string }
type Sch = { id: string; n: string; p: string[]; l: string[]; a: number | null; m: number | null; ac: string | string[] | null; np: number | null; cl: string | null; e: string; c: string | string[] | null; f: string[] | null; r: boolean | null; u: string | null }

const D = require('./data.json') as Data
const SCH = require('./scholarships.json') as Sch[]
const CITY_STATE = require('./city_state.json') as Record<string, string>   // kota (suburb CRICOS) -> negara bagian
const STATES: { key: string; label: string }[] = [
  { key: 'NSW', label: 'New South Wales (NSW)' }, { key: 'VIC', label: 'Victoria (VIC)' }, { key: 'QLD', label: 'Queensland (QLD)' },
  { key: 'WA', label: 'Western Australia (WA)' }, { key: 'SA', label: 'South Australia (SA)' }, { key: 'TAS', label: 'Tasmania (TAS)' },
  { key: 'ACT', label: 'Australian Capital Territory (ACT)' }, { key: 'NT', label: 'Northern Territory (NT)' },
]

const TOPIC_LABEL: Record<string, string> = { hosp: 'Perhotelan & pariwisata', trade: 'Teknik vokasi', care: 'Perawatan & kesejahteraan', creative: 'Seni & desain', beauty: 'Kecantikan', sport: 'Olahraga & kebugaran', policy: 'Kebijakan publik', dev: 'Pembangunan internasional', biz: 'Bisnis & manajemen', fin: 'Keuangan & ekonomi', it: 'Teknologi informasi & data', eng: 'Teknik & rekayasa', energy: 'Energi', health: 'Kesehatan', pubhealth: 'Kesehatan masyarakat', edu: 'Pendidikan', env: 'Lingkungan & keberlanjutan', agri: 'Pertanian & pangan', marine: 'Kelautan', law: 'Hukum', social: 'Ilmu sosial & komunikasi', mat: 'Material & manufaktur', mining: 'Pertambangan & sumber daya', sci: 'Sains', plan: 'Perencanaan & arsitektur', transport: 'Transportasi & logistik' }
const TOPIC_LABEL_EN: Record<string, string> = { hosp: 'Hospitality & tourism', trade: 'Vocational trades', care: 'Care & welfare', creative: 'Arts & design', beauty: 'Beauty', sport: 'Sport & fitness', policy: 'Public policy', dev: 'International development', biz: 'Business & management', fin: 'Finance & economics', it: 'IT & data', eng: 'Engineering', energy: 'Energy', health: 'Health', pubhealth: 'Public health', edu: 'Education', env: 'Environment & sustainability', agri: 'Agriculture & food', marine: 'Marine', law: 'Law', social: 'Social sciences & communication', mat: 'Materials & manufacturing', mining: 'Mining & resources', sci: 'Science', plan: 'Planning & architecture', transport: 'Transport & logistics' }
const BULAN_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
type Lang = 'id' | 'en'
const LEVEL_LABEL: Record<string, string> = { d1: 'D1 / Certificate', d3: 'D3 / Diploma', s1: 'S1 / Bachelor', s2: 'S2 / Master', s3: 'S3 / Doktor' }
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const uniByPv = new Map<string, number>()
D.unis.forEach((u, i) => uniByPv.set(u.pv, i))
const pvSch = new Map<string, number>()   // jumlah beasiswa pascasarjana per kampus
SCH.forEach((s) => { if (s.l.includes('pg')) s.p.forEach((pv) => pvSch.set(pv, (pvSch.get(pv) ?? 0) + 1)) })

const rank = (r: any) => (r && r.rank_n != null ? Number(r.rank_n) : null)
const lc = (s: string) => s.toLowerCase()

export function meta(lang: Lang = 'id') {
  const cities = new Map<string, number>()
  D.rows.forEach((r) => (r[5] || []).forEach((c: string) => cities.set(c, (cities.get(c) ?? 0) + 1)))
  const perLevel: Record<string, number> = {}
  D.rows.forEach((r) => { const l = D.levels[r[13]]; perLevel[l] = (perLevel[l] ?? 0) + 1 })
  return {
    levels: D.levels.map((l) => ({ key: l, label: LEVEL_LABEL[l], count: perLevel[l] ?? 0 })),
    topics: D.topics.map((t) => ({ key: t, label: (lang === 'en' ? TOPIC_LABEL_EN[t] : TOPIC_LABEL[t]) ?? t })),
    states: STATES,
    cityState: CITY_STATE,
    cities: Array.from(cities.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([c]) => c),
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

function decode(row: any[], i: number, lang: Lang = 'id') {
  const u = D.unis[row[0]], months: string[] = [], en = lang === 'en'
  for (let m = 1; m <= 12; m++) if ((row[10] >> (m - 1)) & 1) months.push((en ? BULAN_EN : BULAN)[m - 1])
  const w: number | null = row[3] || null, t: number | null = row[4] >= 500 ? row[4] : null   // nilai < 500 = data tidak valid
  const topics = D.topics.filter((_, k) => (row[6] >> k) & 1).map((t) => (en ? TOPIC_LABEL_EN[t] : TOPIC_LABEL[t]) ?? t)
  return {
    id: i, name: row[2], level: D.levels[row[13]], codes: row[1] as string[], providerCode: row[11], url: row[9], urlType: row[14] === 0 ? (en ? 'university' : 'universitas') : (en ? 'CRICOS register' : 'register CRICOS'),
    uni: { i: row[0], name: u.n, curated: u.k === 2, aas: !!u.aas, qs: u.qs ? { rank: u.qs.rank } : null, the: u.the ? { rank: u.the.rank } : null, intlPct: u.the?.intl_pct ?? null },
    cities: (row[5] || []) as string[], weeks: w, years: w ? Math.round((w / 52) * 2) / 2 : null,
    tuitionTotal: t, tuitionPerYear: t && w && w >= 45 ? Math.round(t / (w / 52) / 100) * 100 : null,
    ielts: reqIelts(row), intakes: months, intakeFromData: !!row[15], topics,
    priority: !!row[7],
    careers: ((row[16] || []) as number[]).slice(0, 3).map((k) => { const o = D.occ[k]; return { title: (en ? o[1] : o[2] || o[1]), medianWeekly: o[3] || null } }),
    schCount: pvSch.get(row[11]) ?? 0,
  }
}

export type SearchParams = { level?: string; q?: string; topic?: string; city?: string; state?: string; uni?: number; aas?: boolean; maxIelts?: number; maxTuition?: number; sort?: string; dir?: string; page?: number; lang?: Lang }

export function searchPrograms(p: SearchParams) {
  const li = p.level === 'all' ? -1 : p.level ? D.levels.indexOf(p.level) : 3   // 'all' = semua jenjang
  const tIdx = p.topic ? D.topics.indexOf(p.topic) : -1
  const toks = lc(p.q ?? '').split(/\s+/).filter((x) => x.length > 1).slice(0, 6)
  const out: number[] = []
  D.rows.forEach((r, i) => {
    if (li >= 0 && r[13] !== li) return
    if (tIdx >= 0 && !((r[6] >> tIdx) & 1)) return
    if (p.city && !(r[5] || []).includes(p.city)) return
    if (p.state && !(r[5] || []).some((c: string) => CITY_STATE[c] === p.state)) return
    if (p.uni != null && r[0] !== p.uni) return
    const u = D.unis[r[0]]
    if (p.aas && !u.aas) return
    if (p.maxTuition && (!(r[4] >= 500) || r[4] > p.maxTuition)) return
    if (p.maxIelts) { const q = reqIelts(r); if (!q || q.overall > p.maxIelts) return }
    if (toks.length) { const name = lc(r[2] + ' ' + u.n); if (!toks.every((t) => name.includes(t))) return }
    out.push(i)
  })
  const sort = p.sort || 'rank', dir = p.dir === 'desc' ? -1 : 1
  const qsr = (i: number) => rank(D.unis[D.rows[i][0]].qs) ?? 9999
  const the = (i: number) => rank(D.unis[D.rows[i][0]].the) ?? 9999
  const key = (i: number): number | string | null => {
    const r = D.rows[i]
    if (sort === 'tuition') return r[4] >= 500 ? r[4] : null
    if (sort === 'duration') return r[3] || null
    if (sort === 'ielts') return reqIelts(r)?.overall ?? null
    if (sort === 'name') return String(r[2]).toLowerCase()
    const v = Math.min(qsr(i), the(i)); return v >= 9999 ? null : v   // peringkat: kecil = lebih baik
  }
  out.sort((a, b) => {
    const ka = key(a), kb = key(b)
    if (ka === null || kb === null) { if (ka !== kb) return ka === null ? 1 : -1 }   // data kosong selalu di akhir
    else { const c = typeof ka === 'string' ? ka.localeCompare(kb as string) : ka - (kb as number); if (c) return c * dir }
    return Math.min(qsr(a), the(a)) - Math.min(qsr(b), the(b)) || String(D.rows[a][2]).localeCompare(String(D.rows[b][2]))
  })
  const per = 20, page = Math.max(1, Math.min(p.page || 1, Math.ceil(out.length / per) || 1))
  return { total: out.length, page, perPage: per, rows: out.slice((page - 1) * per, page * per).map((i) => decode(D.rows[i], i, p.lang)) }
}

export type SchParams = { level?: string; q?: string; uni?: number; page?: number; sort?: string; dir?: string }

// Tanggal tenggat yang memuat tahun (mis. "6 Dec 2026"). Yang akan datang diurutkan lebih dulu, yang sudah lewat di belakangnya; tanpa tahun/tak terbaca = kosong.
function deadlineKey(cl: string | null, dir: number): number | null {
  const text = String(cl ?? '')
  if (!/20[0-9][0-9]/.test(text)) return null
  const t = Date.parse(text)
  if (Number.isNaN(t)) return null
  return dir === 1 && t < Date.now() ? t + 1e15 : t   // naik: yang akan datang dulu; turun: tanggal terjauh dulu
}

export function searchScholarships(p: SchParams) {
  const lv = p.level === 'ug' ? 'ug' : p.level === 'all' ? null : 'pg'
  const toks = lc(p.q ?? '').split(/\s+/).filter((x) => x.length > 1).slice(0, 6)
  const pv = p.uni != null && D.unis[p.uni] ? D.unis[p.uni].pv : null
  const list = SCH.filter((s) => {
    if (lv && !s.l.includes(lv)) return false
    if (pv && !s.p.includes(pv)) return false
    if (toks.length) { const hay = lc(s.n + ' ' + s.e + ' ' + s.p.map((c) => D.unis[uniByPv.get(c) ?? -1]?.n ?? '').join(' ')); if (!toks.every((t) => hay.includes(t))) return false }
    return true
  })
  const sort = p.sort || 'amount', dir = p.dir ? (p.dir === 'desc' ? -1 : 1) : (sort === 'amount' ? -1 : 1)   // nominal: terbesar dulu bila tidak dipilih
  const skey = (x: Sch): number | string | null => {
    if (sort === 'name') return x.n.toLowerCase()
    if (sort === 'deadline') return deadlineKey(x.cl, dir)
    const v = x.a ?? x.m; return v ? v : null
  }
  list.sort((a, b) => {
    const ka = skey(a), kb = skey(b)
    if (ka === null || kb === null) { if (ka !== kb) return ka === null ? 1 : -1 }
    else { const c = typeof ka === 'string' ? ka.localeCompare(kb as string) : ka - (kb as number); if (c) return c * dir }
    return a.n.localeCompare(b.n)
  })
  const per = 20, page = Math.max(1, Math.min(p.page || 1, Math.ceil(list.length / per) || 1))
  return {
    total: list.length, page, perPage: per,
    rows: list.slice((page - 1) * per, page * per).map((s) => ({
      id: s.id, name: s.n, unis: s.p.map((c) => D.unis[uniByPv.get(c) ?? -1]?.n).filter(Boolean), amountAnnual: s.a, amountMax: s.m, amountNote: s.ac,
      perYear: s.np, closing: s.cl, eligibility: s.e, citizenship: Array.isArray(s.c) ? (s.c.length ? s.c.join(', ') : null) : (s.c || null), researchOnly: !!s.r, url: s.u,
    })),
  }
}

let _rowIdx: Map<any[], number> | null = null
const rowIndex = () => { if (!_rowIdx) { _rowIdx = new Map(); D.rows.forEach((r, i) => _rowIdx!.set(r, i)) } return _rowIdx }

/** Hasil kuis: kandidat terurut dari mesin kecocokan -> kartu program lengkap (maks 150). */
export function quizPrograms(cands: { row: any[]; score: number; g: number; f: number }[], total: number, lang: Lang = 'id') {
  const idx = rowIndex()
  const rows = cands.slice(0, 150).map((c) => {
    const d = decode(c.row, idx.get(c.row) ?? -1, lang)
    const fit = D.topics.filter((_, k) => ((c.g | c.f) >> k) & 1).map((t) => (lang === 'en' ? TOPIC_LABEL_EN[t] : TOPIC_LABEL[t]) ?? t)
    return { ...d, fit }
  })
  return { total, shown: rows.length, rows }
}

// Saran nama program saat mengetik (awalan kata lebih dulu, lalu yang paling banyak tersedia).
let _names: { name: string; low: string; n: number }[] | null = null
function names() {
  if (!_names) {
    const m = new Map<string, { name: string; low: string; n: number }>()
    D.rows.forEach((r) => { const low = String(r[2]).toLowerCase(); const e = m.get(low); if (e) e.n++; else m.set(low, { name: r[2], low, n: 1 }) })
    _names = Array.from(m.values())
  }
  return _names
}
export function suggestPrograms(q: string, level?: string) {
  const s = q.trim().toLowerCase()
  if (s.length < 2) return []
  const li = level && level !== 'all' ? D.levels.indexOf(level) : -1
  const ok = li < 0 ? null : new Set(D.rows.filter((r) => r[13] === li).map((r) => String(r[2]).toLowerCase()))
  const score = (low: string) => (low.startsWith(s) ? 0 : low.split(/[\s\-/(]+/).some((w) => w.startsWith(s)) ? 1 : 2)
  return names()
    .filter((e) => e.low.includes(s) && (!ok || ok.has(e.low)))
    .sort((a, b) => score(a.low) - score(b.low) || b.n - a.n || a.name.localeCompare(b.name))
    .slice(0, 10).map((e) => e.name)
}
