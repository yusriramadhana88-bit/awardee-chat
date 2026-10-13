// Mini Study Planner — lapisan server di atas mesin kecocokan (engine.js + data.json).
// Database lengkap TIDAK PERNAH dikirim ke browser: halaman publik hanya mengirim jawaban kuis,
// server menghitung dan mengembalikan 2 hasil teratas (produk gratis). Database penuh = produk berbayar.
/* eslint-disable @typescript-eslint/no-var-requires */
const Engine = require('./engine.js') as { create: (d: unknown) => any }

export type Item = { t: 'in' | 'divider'; text: string; btn?: string; wait?: number }
export type Answers = {
  tujuan: string; jenjang: string; field: string; ipk: string; karier: string
  has: string[]; ielts: string; toefl: string; ttype: string; kotas: string[]; status: string
}

let _eng: any = null
function eng() {
  if (!_eng) _eng = Engine.create(require('./data.json'))
  return _eng
}

const TUJUAN = ['aas', 'lpdp', 'mandiri', 'bingung']
const JENJANG = ['d1', 'd3', 's1', 's2', 's3']
const IELTS = ['4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0']
const KOTA = ['wisata', 'keluarga', 'murah', 'program']
const STATUS = ['asn', 'bumn', 'dosen', 'wira', 'fresh']

/** Validasi + normalisasi jawaban dari klien. Null bila tidak masuk akal (bukan dari form kita). */
export function sanitizeAnswers(raw: any): Answers | null {
  if (!raw || typeof raw !== 'object') return null
  const e = eng()
  const fields: string[] = [...e.FIELDS, ...e.FIELDS_VOC].map((f: string[]) => f[0])
  const ipks: string[] = e.IPKS.map((f: string[]) => f[0])
  const str = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
  const a: Answers = {
    tujuan: str(raw.tujuan, 20), jenjang: str(raw.jenjang, 5), field: str(raw.field, 20), ipk: str(raw.ipk, 10),
    karier: str(raw.karier, 240),
    has: Array.isArray(raw.has) ? raw.has.map((x: unknown) => str(x, 8)).filter((x: string) => ['ielts', 'toefl', 'none'].includes(x)).slice(0, 2) : [],
    ielts: str(raw.ielts, 4), toefl: str(raw.toefl, 4), ttype: str(raw.ttype, 4) === 'itp' ? 'itp' : 'ibt',
    kotas: Array.isArray(raw.kotas) ? Array.from(new Set<string>(raw.kotas.map((x: unknown) => str(x, 10)))).filter((x) => KOTA.includes(x)).slice(0, 2) : [],
    status: str(raw.status, 8),
  }
  if (!TUJUAN.includes(a.tujuan) || !JENJANG.includes(a.jenjang) || !fields.includes(a.field)) return null
  if (!(ipks.includes(a.ipk) || a.ipk === 'na') || !STATUS.includes(a.status)) return null
  if (a.karier.length < 3 || !a.kotas.length) return null
  if (a.has.includes('ielts')) { if (!IELTS.includes(a.ielts)) return null } else a.ielts = ''
  if (a.has.includes('toefl')) {
    const s = parseInt(a.toefl, 10), lo = a.ttype === 'ibt' ? 0 : 310, hi = a.ttype === 'ibt' ? 120 : 677
    if (isNaN(s) || s < lo || s > hi) return null
    a.toefl = String(s)
  } else a.toefl = ''
  return a
}

export function runPlanner(a: Answers, name: string) {
  const e = eng()
  const res = e.compute(a)
  const items: Item[] = e.buildScript(res, a, name)
  const picks = (res.picks as any[]).slice(0, 2).map((c) => ({ program: c.row[2], codes: c.row[1], score: Math.round(c.score * 10) / 10 }))
  return { res, items, picks, total: res.total as number, unis: res.unis as number }
}

/** Item chat yang dikirim langsung setelah user membuka jendela percakapan (tanpa pesan "Besok").
 *  Ajakan "balas AKSES" diganti ajakan mengetuk tombol (tombol dibuat oleh pemanggil: CTA lynk.id). */
export function resultItems(items: Item[]): Item[] {
  const i = items.findIndex((x) => x.t === 'divider')
  const out = (i < 0 ? items : items.slice(0, i)).filter((x) => x.t === 'in').map((x) =>
    x.btn ? { ...x, text: x.text.replace(/\s*—\s*balas \*AKSES\*\.?$/, '. Ketuk tombol di bawah 👇') } : x)
  if (!out.some((x) => x.btn)) {
    out.push({ t: 'in', btn: 'AKSES', wait: 900, text: 'Mau lihat lebih banyak program, beasiswa, dan kode CRICOS untuk formulirmu? Ada di *Akses Database STUDY PLANNER by Awardee.id* (Rp97.000, selamanya). Ketuk tombol di bawah 👇' })
  }
  return out
}
