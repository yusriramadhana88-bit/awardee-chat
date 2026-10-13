'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Meta = {
  levels: { key: string; label: string; count: number }[]
  topics: { key: string; label: string }[]
  cities: string[]
  states: { key: string; label: string }[]
  cityState: Record<string, string>
  unis: { i: number; n: string; k: number; aas: boolean }[]
  stats: { programs: number; institutions: number; universities: number; scholarships: number; snapshot: string }
}
type Prog = {
  id: number; name: string; level: string; codes: string[]; providerCode: string; url: string; urlType: string
  uni: { i: number; name: string; curated: boolean; aas: boolean; qs: { rank: string } | null; the: { rank: string } | null; intlPct: number | null }
  cities: string[]; years: number | null; tuitionTotal: number | null; tuitionPerYear: number | null
  ielts: { overall: number; band: number | null; src: string } | null; intakes: string[]; intakeFromData: boolean
  topics: string[]; priority: boolean; careers: { title: string; medianWeekly: number | null }[]; schCount: number; fit?: string[]
}
type Sch = {
  id: string; name: string; unis: string[]; amountAnnual: number | null; amountMax: number | null; amountNote: string | null
  perYear: number | null; closing: string | null; eligibility: string; citizenship: string | null; researchOnly: boolean; url: string | null
}
type Gate = { state: 'loading' } | { state: 'ok' } | { state: 'locked'; buyUrl: string; waNumber: string; email: string } | { state: 'error'; msg: string }
type Quiz = { total: number; shown: number; generic: boolean; rows: Prog[] }

const aud = (n: number) => 'AUD ' + Math.round(n).toLocaleString('id-ID')
const fmt1 = (n: number) => String(n).replace('.', ',')
const rk = (r: string) => (/^\d+$/.test(r) ? '#' + r : r)
const inp = 'w-full border border-hairline rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold'

// Kolom isian dengan saran: ketik beberapa huruf, daftar yang cocok muncul (semua item tersedia, bukan hanya sebagian).
function Suggest({ label, items, value, placeholder, onPick }: {
  label: string; items: { key: string; label: string; sub?: string }[]; value: string; placeholder: string; onPick: (key: string, label: string) => void
}) {
  const [text, setText] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setText(value) }, [value])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const q = text.trim().toLowerCase()
  const score = (it: { label: string; sub?: string }) => (it.sub ? 0 : 2) + (it.label.toLowerCase().startsWith(q) ? 0 : 1)   // universitas terkurasi (★) dan awalan kata lebih dulu
  const matches = q ? items.filter((it) => it.label.toLowerCase().includes(q)).sort((a, b) => score(a) - score(b)).slice(0, 12) : []
  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <div className="relative">
        <input className={inp} value={text} placeholder={placeholder} autoComplete="off"
          onChange={(e) => { setText(e.target.value); setOpen(true); if (!e.target.value) onPick('', '') }}
          onFocus={() => setOpen(true)} />
        {text && <button type="button" aria-label="Hapus" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted text-lg leading-none px-1" onClick={() => { setText(''); onPick('', ''); setOpen(false) }}>×</button>}
      </div>
      {open && q && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-hairline rounded-lg shadow-lg text-sm">
          {matches.length === 0 && <li className="px-3 py-2 text-muted">Tidak ditemukan</li>}
          {matches.map((it) => (
            <li key={it.key}>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-off" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setText(it.label); onPick(it.key, it.label); setOpen(false) }}>
                {it.label}{it.sub && <span className="text-muted"> {it.sub}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


// Kolom cari program dengan saran nama program (muncul setelah 2 huruf; awalan kata lebih dulu).
function NameSearch({ value, label, placeholder, suggest, onChange }: {
  value: string; label: string; placeholder: string; suggest: ((q: string) => Promise<string[]>) | null; onChange: (q: string) => void
}) {
  const [items, setItems] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => {
    if (!suggest || value.trim().length < 2) { setItems([]); return }
    let cancelled = false
    const t = setTimeout(() => { suggest(value).then((r) => { if (!cancelled) setItems(r) }) }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [value, suggest])
  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <input className={inp} value={value} placeholder={placeholder} autoComplete="off" onFocus={() => setOpen(true)}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }} />
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-72 overflow-auto bg-white border border-hairline rounded-lg shadow-lg text-sm">
          {items.map((n) => (
            <li key={n}>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-off" onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(n); setOpen(false) }}>{n}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function StudyPlannerApp({ standalone = false }: { standalone?: boolean }) {
  const supabase = createClient()
  const pathname = usePathname()
  const [gate, setGate] = useState<Gate>({ state: 'loading' })
  const [meta, setMeta] = useState<Meta | null>(null)
  const [tab, setTab] = useState<'program' | 'beasiswa'>('program')
  const [f, setF] = useState({ level: 'all', q: '', topic: '', city: '', state: '', uni: '', uniLabel: '', aas: false, maxIelts: '', maxTuition: '', sort: 'rank' })
  const [page, setPage] = useState(1)
  const [res, setRes] = useState<{ total: number; page: number; perPage: number; rows: any[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | string | null>(null)
  const [copied, setCopied] = useState('')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizBusy, setQuizBusy] = useState(false)
  const [quizPage, setQuizPage] = useState(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = `/login?next=${encodeURIComponent(pathname || '/planner')}`; return null }
    return session.access_token
  }, [supabase, pathname])

  const api = useCallback(async (qs: string) => {
    const t = await token(); if (!t) return null
    const r = await fetch('/api/study-planner/db?' + qs, { headers: { Authorization: `Bearer ${t}` } })
    if (r.status === 401) { window.location.href = `/login?next=${encodeURIComponent(pathname || '/planner')}`; return null }
    if (r.status === 403) { const j = await r.json(); setGate({ state: 'locked', buyUrl: j.buyUrl, waNumber: j.waNumber, email: j.email }); return null }
    if (!r.ok) { setGate({ state: 'error', msg: 'Gagal memuat database. Muat ulang halaman.' }); return null }
    return r.json()
  }, [token, pathname])

  const suggestNames = useCallback(async (q: string) => {
    const r = await api(`mode=suggest&q=${encodeURIComponent(q)}&level=${f.level}`)
    return (r?.names ?? []) as string[]
  }, [api, f.level])

  useEffect(() => { api('mode=meta').then((m) => { if (m) { setMeta(m); setGate({ state: 'ok' }) } }) }, [api])

  useEffect(() => {
    if (gate.state !== 'ok' || quiz) return
    const p = new URLSearchParams()
    if (tab === 'program') {
      p.set('level', f.level); p.set('sort', f.sort); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.topic) p.set('topic', f.topic); if (f.city) p.set('city', f.city); if (f.state) p.set('state', f.state)
      if (f.uni) p.set('uni', f.uni); if (f.aas) p.set('aas', '1'); if (f.maxIelts) p.set('maxIelts', f.maxIelts); if (f.maxTuition) p.set('maxTuition', f.maxTuition)
    } else {
      p.set('mode', 'scholarships'); p.set('level', f.level === 'all' ? 'all' : f.level === 's2' || f.level === 's3' ? 'pg' : 'ug'); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.uni) p.set('uni', f.uni)
    }
    setBusy(true)
    const t = setTimeout(() => { api(p.toString()).then((r) => { if (r) { setRes(r); setOpen(null) } setBusy(false) }) }, 250)
    return () => clearTimeout(t)
  }, [gate.state, tab, f, page, api, quiz])

  // Hasil kuis dari iframe (halaman /planner-quiz.html, satu origin) -> cari di server.
  useEffect(() => {
    const h = async (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'sp-quiz') return
      setQuizBusy(true)
      const t = await token(); if (!t) return
      const r = await fetch('/api/study-planner/db', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: e.data.answers }) })
      setQuizBusy(false)
      if (!r.ok) { setQuizOpen(false); alert('Gagal memproses kuis. Coba lagi.'); return }
      setQuiz(await r.json()); setQuizPage(1); setOpen(null); setQuizOpen(false); setTab('program')
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [token])

  const set = (patch: Partial<typeof f>) => { setF({ ...f, ...patch }); setPage(1) }
  const copy = (text: string) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500) }

  if (gate.state === 'loading') return <div className="p-8 text-sm text-muted">Memuat database…</div>
  if (gate.state === 'error') return <div className="p-8 text-sm text-red-600">{gate.msg}</div>
  if (gate.state === 'locked') {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-hairline p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-ink mb-2">Akses Database STUDY PLANNER</h1>
          <p className="text-sm text-muted mb-4">Buka semua program D1–S3 di Australia yang cocok dengan profilmu, kode CRICOS siap salin, link resmi, peringkat QS &amp; THE, serta 400+ beasiswa pascasarjana.</p>
          <p className="text-sm mb-1"><s className="text-muted">Rp150.000</s> <b className="text-ink text-lg">Rp97.000</b></p>
          <p className="text-xs text-muted mb-5">Sekali bayar, akses selamanya · promo untuk 88 pembeli pertama</p>
          {gate.buyUrl && <a href={gate.buyUrl} target="_blank" rel="noopener noreferrer" className="block bg-gold hover:bg-gold-2 text-ink font-bold py-3 rounded-pill text-sm transition-colors">Dapatkan Akses</a>}
          <p className="text-xs text-muted mt-5">Sudah bayar tapi belum terbuka? Pastikan kamu masuk dengan email/HP yang sama dengan saat membeli ({gate.email || 'akunmu'}), atau <a className="underline" href={`https://wa.me/${gate.waNumber}?text=${encodeURIComponent('Halo, saya sudah bayar Akses Database STUDY PLANNER tapi belum terbuka. Email: ' + gate.email)}`} target="_blank" rel="noopener noreferrer">hubungi kami di WhatsApp</a>.</p>
        </div>
      </div>
    )
  }

  const pages = res ? Math.max(1, Math.ceil(res.total / res.perPage)) : 1
  const quizPer = 10
  const quizPages = quiz ? Math.max(1, Math.ceil(quiz.rows.length / quizPer)) : 1
  const uniItems = (meta?.unis ?? []).map((u) => ({ key: String(u.i), label: u.n, sub: u.k === 2 ? '★' : '' }))
  const cityItems = (meta?.cities ?? []).filter((c) => !f.state || meta?.cityState[c] === f.state).map((c) => ({ key: c, label: c, sub: meta?.cityState[c] ? `· ${meta.cityState[c]}` : '' }))

  const ProgCard = (p: Prog) => (
    <div key={p.id} className="bg-white rounded-xl border border-hairline p-4">
      <button className="w-full text-left" onClick={() => setOpen(open === p.id ? null : p.id)}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-ink">{p.name}</div>
            <div className="text-sm text-muted">{p.uni.name}{p.uni.curated ? ' ★' : ''} · {p.cities.slice(0, 2).join(' / ') || '—'}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {p.uni.qs && <span className="px-2 py-0.5 rounded-full bg-gold/30">QS {rk(p.uni.qs.rank)}</span>}
            {p.uni.the && <span className="px-2 py-0.5 rounded-full bg-gold/30">THE {rk(p.uni.the.rank)}</span>}
            {p.uni.aas && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">AAS</span>}
            {p.priority && <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">Bidang prioritas</span>}
          </div>
        </div>
        {p.fit && p.fit.length > 0 && <div className="mt-1 text-xs text-emerald-800">✅ Cocok di: {p.fit.slice(0, 3).join(', ')}</div>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
          <span>⏳ {p.years ? `${fmt1(p.years)} tahun` : 'durasi ikut kampus'}</span>
          <span>💰 {p.tuitionTotal ? `total ±${aud(p.tuitionTotal)}${p.tuitionPerYear ? ` (±${aud(p.tuitionPerYear)}/tahun)` : ''}` : 'biaya: cek halaman resmi'}</span>
          <span>🗣️ {p.ielts ? `IELTS ${fmt1(p.ielts.overall)}${p.ielts.band ? ` (band ≥ ${fmt1(p.ielts.band)})` : ''} · ${p.ielts.src}` : 'syarat bahasa: cek halaman resmi'}</span>
          <span>🗓️ {p.intakes.length ? p.intakes.join(', ') : '—'}{p.intakes.length && !p.intakeFromData ? ' (umum)' : ''}</span>
        </div>
      </button>
      {open === p.id && (
        <div className="mt-3 pt-3 border-t border-hairline text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted">Kode CRICOS program:</span>
            {p.codes.map((c) => (
              <button key={c} onClick={() => copy(c)} className="font-mono text-xs px-2 py-1 rounded bg-off border border-hairline hover:border-ink">{copied === c ? 'Tersalin ✓' : c}</button>
            ))}
            <span className="text-muted ml-2">Kampus:</span>
            <button onClick={() => copy(p.providerCode)} className="font-mono text-xs px-2 py-1 rounded bg-off border border-hairline hover:border-ink">{copied === p.providerCode ? 'Tersalin ✓' : p.providerCode}</button>
          </div>
          {p.topics.length > 0 && <div><span className="text-muted">Bidang:</span> {p.topics.join(', ')}</div>}
          {p.uni.intlPct != null && <div><span className="text-muted">Mahasiswa internasional:</span> {fmt1(p.uni.intlPct)}% (THE)</div>}
          {p.careers.length > 0 && (
            <div>
              <span className="text-muted">Karier ke depan (dipetakan otomatis ke klasifikasi pekerjaan resmi Australia, bukan jaminan):</span>
              <ul className="list-disc ml-5">{p.careers.map((c) => <li key={c.title}>{c.title}{c.medianWeekly ? ` — median AUD ${c.medianWeekly.toLocaleString('id-ID')}/minggu` : ''}</li>)}</ul>
            </div>
          )}
          {p.schCount > 0 && !quiz && <div><button className="underline" onClick={() => { setTab('beasiswa'); set({ uni: String(p.uni.i), uniLabel: p.uni.name, q: '' }) }}>Lihat {p.schCount} beasiswa pascasarjana di {p.uni.name} →</button></div>}
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-navy text-white px-4 py-2 rounded-pill text-xs font-semibold">Halaman resmi program ({p.urlType}) ↗</a>
        </div>
      )}
    </div>
  )

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Database STUDY PLANNER</h1>
          <p className="text-sm text-muted mt-0.5">
            {meta && <>{meta.stats.programs.toLocaleString('id-ID')} program · {meta.stats.institutions} institusi · {meta.stats.universities} universitas · {meta.stats.scholarships} beasiswa pascasarjana · data {meta.stats.snapshot}</>}
          </p>
        </div>
        <button onClick={() => { setQuizOpen(true); iframeRef.current?.contentWindow?.postMessage({ type: 'sp-reset' }, window.location.origin) }} className="bg-gold hover:bg-gold-2 text-ink text-sm font-bold px-4 py-2 rounded-pill transition-colors">
          🎯 Cari lewat kuis (7 pertanyaan)
        </button>
      </div>

      {quiz ? (
        <>
          <div className="bg-white rounded-xl border border-hairline p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <b>Hasil kuis:</b> {quiz.total.toLocaleString('id-ID')} program cocok dengan profilmu{quiz.total > quiz.shown ? `, ${quiz.shown} teratas ditampilkan` : ''}, urut dari yang paling cocok.
              {quiz.generic && <span className="text-muted"> Targetmu belum spesifik, jadi dimulai dari program umum.</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setQuizOpen(true); iframeRef.current?.contentWindow?.postMessage({ type: 'sp-reset' }, window.location.origin) }} className="px-4 py-2 text-xs font-semibold rounded-pill border border-hairline bg-white">Ulangi kuis</button>
              <button onClick={() => { setQuiz(null); setOpen(null) }} className="px-4 py-2 text-xs font-semibold rounded-pill bg-navy text-white">Kembali ke pencarian bebas</button>
            </div>
          </div>
          <div className="space-y-3">{quiz.rows.slice((quizPage - 1) * quizPer, quizPage * quizPer).map(ProgCard)}</div>
          {quizPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={quizPage <= 1} onClick={() => { setQuizPage(quizPage - 1); setOpen(null) }} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">← Sebelumnya</button>
              <span className="text-sm text-muted">{quizPage} / {quizPages}</span>
              <button disabled={quizPage >= quizPages} onClick={() => { setQuizPage(quizPage + 1); setOpen(null) }} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">Berikutnya →</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {(['program', 'beasiswa'] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); setRes(null) }} className={`px-4 py-2 rounded-pill text-sm font-semibold border ${tab === t ? 'bg-navy text-white border-navy' : 'bg-white text-ink border-hairline'}`}>
                {t === 'program' ? 'Program studi' : 'Beasiswa kampus'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-hairline p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Jenjang</label>
              <select className={inp} value={f.level} onChange={(e) => set({ level: e.target.value })}>
                <option value="all">Semua jenjang ({meta?.stats.programs.toLocaleString('id-ID')})</option>
                {meta?.levels.map((l) => <option key={l.key} value={l.key}>{l.label} ({l.count.toLocaleString('id-ID')})</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <NameSearch label={`Cari ${tab === 'program' ? 'nama program / kampus' : 'beasiswa'}`} value={f.q} suggest={tab === 'program' ? suggestNames : null}
                placeholder={tab === 'program' ? 'ketik 2 huruf, mis. pub → Public Policy, Public Health' : 'mis. women, merit, engineering'} onChange={(q) => set({ q })} />
            </div>
            <Suggest label="Kampus (ketik namanya)" items={uniItems} value={f.uniLabel} placeholder="mis. Monash, Flinders, Curtin" onPick={(key, label) => set({ uni: key, uniLabel: label })} />
            {tab === 'program' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bidang</label>
                  <select className={inp} value={f.topic} onChange={(e) => set({ topic: e.target.value })}>
                    <option value="">Semua bidang</option>
                    {meta?.topics.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Negara bagian</label>
                  <select className={inp} value={f.state} onChange={(e) => set({ state: e.target.value })}>
                    <option value="">Semua negara bagian</option>
                    {meta?.states.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
                  </select>
                </div>
                <Suggest label="Kota (ketik namanya)" items={cityItems} value={f.city} placeholder="mis. Canberra, Perth, Hobart" onPick={(key) => set({ city: key })} />
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">IELTS maksimal yang diminta</label>
                  <select className={inp} value={f.maxIelts} onChange={(e) => set({ maxIelts: e.target.value })}>
                    <option value="">Semua</option>
                    {[5.5, 6, 6.5, 7, 7.5].map((v) => <option key={v} value={v}>{fmt1(v)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Total biaya kuliah maks. (AUD)</label>
                  <select className={inp} value={f.maxTuition} onChange={(e) => set({ maxTuition: e.target.value })}>
                    <option value="">Semua</option>
                    {[20000, 40000, 60000, 80000, 120000].map((v) => <option key={v} value={v}>≤ {v.toLocaleString('id-ID')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Urutkan</label>
                  <select className={inp} value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                    <option value="rank">Peringkat kampus (QS/THE)</option>
                    <option value="tuition">Biaya termurah</option>
                    <option value="name">Nama program (A–Z)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink pt-5">
                  <input type="checkbox" checked={f.aas} onChange={(e) => set({ aas: e.target.checked })} /> Hanya kampus peserta AAS
                </label>
              </>
            )}
          </div>

          <div className="text-xs text-muted mb-3">{busy ? 'Mencari…' : res ? `${res.total.toLocaleString('id-ID')} hasil · halaman ${res.page} dari ${pages}` : ''}{tab === 'program' && ' · ★ = universitas dengan data syarat bahasa terverifikasi'}</div>

          <div className="space-y-3">
            {tab === 'program' && (res?.rows as Prog[] | undefined)?.map(ProgCard)}
            {tab === 'beasiswa' && (res?.rows as Sch[] | undefined)?.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-hairline p-4">
                <button className="w-full text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <div className="font-semibold text-ink">{s.name}</div>
                  <div className="text-sm text-muted">{s.unis.join(', ') || '—'}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
                    <span>💰 {s.amountAnnual ? `${aud(s.amountAnnual)}/tahun` : s.amountMax ? `hingga ${aud(s.amountMax)}` : s.amountNote || 'nominal: lihat halaman resmi'}</span>
                    {s.closing && <span>⏰ tutup {s.closing}</span>}
                    {s.perYear && <span>🎓 {s.perYear} penerima/tahun</span>}
                    {s.researchOnly && <span>🔬 khusus riset</span>}
                  </div>
                </button>
                {open === s.id && (
                  <div className="mt-3 pt-3 border-t border-hairline text-sm space-y-2">
                    {s.citizenship && <div><span className="text-muted">Kewarganegaraan:</span> {s.citizenship}</div>}
                    {s.eligibility && <div><span className="text-muted">Syarat ringkas:</span> {s.eligibility.replace(/;\s*/g, '; ')}</div>}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-navy text-white px-4 py-2 rounded-pill text-xs font-semibold">Halaman resmi beasiswa ↗</a>}
                    <div className="text-xs text-muted">Selalu cek ulang syarat &amp; tenggat di halaman resmi sebelum mendaftar.</div>
                  </div>
                )}
              </div>
            ))}
            {res && res.rows.length === 0 && <div className="text-sm text-muted p-6 text-center">Tidak ada hasil. Longgarkan filter atau ubah kata kunci.</div>}
          </div>

          {res && pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">← Sebelumnya</button>
              <span className="text-sm text-muted">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">Berikutnya →</button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-muted mt-8">Angka biaya adalah estimasi biaya kuliah saja (belum termasuk biaya hidup). Selalu verifikasi syarat bahasa, biaya, dan jadwal di halaman resmi kampus sebelum mendaftar.</p>

      {/* Kuis 7 pertanyaan (iframe satu origin; hasilnya dikirim lewat postMessage) */}
      <div className={quizOpen ? 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3' : 'hidden'}>
        <div className="bg-off rounded-2xl w-full max-w-lg h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-white">
            <b className="text-sm">Kuis pencarian · 7 pertanyaan</b>
            <button onClick={() => setQuizOpen(false)} className="text-muted text-xl leading-none px-2" aria-label="Tutup">×</button>
          </div>
          {quizBusy && <div className="px-4 py-2 text-xs text-muted bg-white">Mencari program yang cocok…</div>}
          <iframe ref={iframeRef} src="/planner-quiz.html" title="Kuis Study Planner" className="flex-1 w-full border-0" />
        </div>
      </div>
      {standalone && <span className="hidden" />}
    </div>
  )
}
