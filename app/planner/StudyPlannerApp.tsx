'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLang, T } from '@/lib/study-planner/lang'
import LangToggle from './LangToggle'

type Meta = {
  levels: { key: string; label: string; count: number }[]
  topics: { key: string; label: string }[]
  cities: string[]
  states: { key: string; label: string }[]
  cityState: Record<string, string>
  unis: { i: number; n: string; k: number; aas: boolean }[]
  stats: { programs: number; institutions: number; universities: number; scholarships: number; snapshot: string; built: string }
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
type Gate = { state: 'loading' } | { state: 'ok' } | { state: 'locked'; buyUrl: string; buyUrlEn: string; waNumber: string; email: string } | { state: 'error'; msg: string }
type Quiz = { total: number; shown: number; generic: boolean; rows: Prog[] }

const aud = (n: number) => 'AUD ' + Math.round(n).toLocaleString('id-ID')
const fmt1 = (n: number) => String(n).replace('.', ',')
const rk = (r: string) => (/^\d+$/.test(r) ? '#' + r : r)
// Urutkan hasil kuis di sisi klien. Data kosong selalu di akhir, apa pun arahnya.
const rankNum = (r?: { rank: string } | null) => (r ? parseInt(r.rank, 10) || null : null)
function sortQuiz(rows: Prog[], by: string, dir: string): Prog[] {
  const m = dir === 'desc' ? -1 : 1
  if (by === 'rel') return dir === 'desc' ? [...rows].reverse() : rows
  const key = (r: Prog): number | string | null => {
    if (by === 'tuition') return r.tuitionTotal
    if (by === 'duration') return r.years
    if (by === 'ielts') return r.ielts ? r.ielts.overall : null
    if (by === 'name') return r.name.toLowerCase()
    const a = rankNum(r.uni.qs), b = rankNum(r.uni.the)
    return a != null && b != null ? Math.min(a, b) : (a ?? b)
  }
  return [...rows].sort((x, y) => {
    const kx = key(x), ky = key(y)
    if (kx === null || ky === null) return kx === ky ? 0 : kx === null ? 1 : -1
    const c = typeof kx === 'string' ? kx.localeCompare(ky as string) : kx - (ky as number)
    return c * m
  })
}
const NL = String.fromCharCode(10)
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
        {text && <button type="button" aria-label="Clear" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted text-lg leading-none px-1" onClick={() => { setText(''); onPick('', ''); setOpen(false) }}>×</button>}
      </div>
      {open && q && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white border border-hairline rounded-lg shadow-lg text-sm">
          {matches.length === 0 && <li className="px-3 py-2 text-muted">—</li>}
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
  const { lang } = useLang()
  const t = T[lang]
  const [gate, setGate] = useState<Gate>({ state: 'loading' })
  const [meta, setMeta] = useState<Meta | null>(null)
  const [tab, setTab] = useState<'program' | 'beasiswa'>('program')
  const [f, setF] = useState({ level: 'all', q: '', topic: '', city: '', state: '', uni: '', uniLabel: '', aas: false, maxIelts: '', maxTuition: '', sort: 'rank', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [res, setRes] = useState<{ total: number; page: number; perPage: number; rows: any[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | string | null>(null)
  const [copied, setCopied] = useState('')
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizBusy, setQuizBusy] = useState(false)
  const [quizPage, setQuizPage] = useState(1)
  const [quizSort, setQuizSort] = useState('rel')
  const [quizDir, setQuizDir] = useState('asc')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = `/login?next=${encodeURIComponent(pathname || '/planner')}`; return null }
    return session.access_token
  }, [supabase, pathname])

  const api = useCallback(async (qs: string) => {
    const t = await token(); if (!t) return null
    const r = await fetch('/api/study-planner/db?' + qs + '&lang=' + lang, { headers: { Authorization: `Bearer ${t}` } })
    if (r.status === 401) { window.location.href = `/login?next=${encodeURIComponent(pathname || '/planner')}`; return null }
    if (r.status === 403) { const j = await r.json(); setGate({ state: 'locked', buyUrl: j.buyUrl, buyUrlEn: j.buyUrlEn, waNumber: j.waNumber, email: j.email }); return null }
    if (!r.ok) { setGate({ state: 'error', msg: T[lang].loadErr }); return null }
    return r.json()
  }, [token, pathname, lang])

  const suggestNames = useCallback(async (q: string) => {
    const r = await api(`mode=suggest&q=${encodeURIComponent(q)}&level=${f.level}`)
    return (r?.names ?? []) as string[]
  }, [api, f.level])

  useEffect(() => { api('mode=meta').then((m) => { if (m) { setMeta(m); setGate({ state: 'ok' }) } }) }, [api])

  useEffect(() => {
    if (gate.state !== 'ok' || quiz) return
    const p = new URLSearchParams()
    if (tab === 'program') {
      p.set('level', f.level); p.set('sort', f.sort); p.set('dir', f.dir); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.topic) p.set('topic', f.topic); if (f.city) p.set('city', f.city); if (f.state) p.set('state', f.state)
      if (f.uni) p.set('uni', f.uni); if (f.aas) p.set('aas', '1'); if (f.maxIelts) p.set('maxIelts', f.maxIelts); if (f.maxTuition) p.set('maxTuition', f.maxTuition)
    } else {
      p.set('mode', 'scholarships'); p.set('level', f.level === 'all' ? 'all' : f.level === 's2' || f.level === 's3' ? 'pg' : 'ug'); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.uni) p.set('uni', f.uni)
      p.set('sort', f.sort); p.set('dir', f.dir)
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
      const r = await fetch('/api/study-planner/db', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: e.data.answers, lang }) })
      setQuizBusy(false)
      if (!r.ok) { setQuizOpen(false); alert(T[lang].quizFail); return }
      setQuiz(await r.json()); setQuizPage(1); setOpen(null); setQuizOpen(false); setTab('program')
    }
    window.addEventListener('message', h)
    return () => window.removeEventListener('message', h)
  }, [token, lang])

  const set = (patch: Partial<typeof f>) => { setF({ ...f, ...patch }); setPage(1) }
  const copy = (text: string) => { navigator.clipboard?.writeText(text); setCopied(text); setTimeout(() => setCopied(''), 1500) }

  if (gate.state === 'loading') return <div className="p-8 text-sm text-muted">{t.loading}</div>
  if (gate.state === 'error') return <div className="p-8 text-sm text-red-600">{gate.msg}</div>
  if (gate.state === 'locked') {
    return (
      <div className="px-4 py-8 lg:px-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-hairline p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-xl font-bold text-ink mb-2">{t.lockedTitle}</h1>
          <p className="text-sm text-muted mb-4">{t.lockedBody}</p>
          <p className="text-sm mb-1">{lang === 'en' ? <><s className="text-muted">$25</s> <b className="text-ink text-lg">$14.70</b></> : <><s className="text-muted">Rp150.000</s> <b className="text-ink text-lg">Rp97.000</b></>}</p>
          <p className="text-xs text-muted mb-5">{t.lockedPrice}</p>
          {(lang === 'en' ? gate.buyUrlEn : gate.buyUrl) && <a href={lang === 'en' ? gate.buyUrlEn : gate.buyUrl} target="_blank" rel="noopener noreferrer" className="block bg-gold hover:bg-gold-2 text-ink font-bold py-3 rounded-pill text-sm transition-colors">{t.getAccess}</a>}
          <p className="text-xs text-muted mt-5">{t.lockedHelp(gate.email)}<a className="underline" href={`https://wa.me/${gate.waNumber}?text=${encodeURIComponent(t.waMsg(gate.email))}`} target="_blank" rel="noopener noreferrer">{t.contactWa}</a>.</p>
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
            {p.priority && <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">{t.priority}</span>}
          </div>
        </div>
        {p.fit && p.fit.length > 0 && <div className="mt-1 text-xs text-emerald-800">✅ {t.fitIn}{p.fit.slice(0, 3).join(', ')}</div>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
          <span>⏳ {p.years ? t.duration(fmt1(p.years)) : t.durationNone}</span>
          <span>💰 {p.tuitionTotal ? t.cost(aud(p.tuitionTotal), p.tuitionPerYear ? aud(p.tuitionPerYear) : null) : t.costNone}</span>
          <span>🗣️ {p.ielts ? t.langReq(fmt1(p.ielts.overall), p.ielts.band ? fmt1(p.ielts.band) : null, p.ielts.src) : t.langNone}</span>
          <span>🗓️ {p.intakes.length ? p.intakes.join(', ') : '—'}{p.intakes.length && !p.intakeFromData ? t.intakeGeneral : ''}</span>
        </div>
      </button>
      {open === p.id && (
        <div className="mt-3 pt-3 border-t border-hairline text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted">{t.cricosProg}</span>
            {p.codes.map((c) => (
              <button key={c} onClick={() => copy(c)} className="font-mono text-xs px-2 py-1 rounded bg-off border border-hairline hover:border-ink">{copied === c ? t.copied : c}</button>
            ))}
            <span className="text-muted ml-2">{t.campusCode}</span>
            <button onClick={() => copy(p.providerCode)} className="font-mono text-xs px-2 py-1 rounded bg-off border border-hairline hover:border-ink">{copied === p.providerCode ? t.copied : p.providerCode}</button>
          </div>
          {p.topics.length > 0 && <div><span className="text-muted">{t.topics}</span> {p.topics.join(', ')}</div>}
          {p.uni.intlPct != null && <div><span className="text-muted">{t.intl}</span> {fmt1(p.uni.intlPct)}% (THE)</div>}
          {p.careers.length > 0 && (
            <div>
              <span className="text-muted">{t.careers}</span>
              <ul className="list-disc ml-5">{p.careers.map((c) => <li key={c.title}>{c.title}{c.medianWeekly ? t.median(c.medianWeekly.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')) : ''}</li>)}</ul>
            </div>
          )}
          {p.schCount > 0 && !quiz && <div><button className="underline" onClick={() => { setTab('beasiswa'); set({ uni: String(p.uni.i), uniLabel: p.uni.name, q: '' }) }}>{t.schLink(p.schCount, p.uni.name)}</button></div>}
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-navy text-white px-4 py-2 rounded-pill text-xs font-semibold">{t.officialProg(p.urlType)}</a>
        </div>
      )}
    </div>
  )

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{t.title}</h1>
          <p className="text-sm text-muted mt-0.5">
            {meta && t.stats(meta.stats.programs.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID'), meta.stats.institutions, meta.stats.universities, meta.stats.scholarships, new Date(meta.stats.built).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { month: 'long', year: 'numeric' }))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!standalone && <LangToggle />}
          <button onClick={() => { setQuizOpen(true); iframeRef.current?.contentWindow?.postMessage({ type: 'sp-reset' }, window.location.origin) }} className="bg-gold hover:bg-gold-2 text-ink text-sm font-bold px-4 py-2 rounded-pill transition-colors">
          {t.quizBtn}
          </button>
        </div>
      </div>

      {quiz ? (
        <>
          <div className="bg-white rounded-xl border border-hairline p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <b>{t.quizResultLabel}</b> {t.quizResult(quiz.total.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID'), quiz.shown, quiz.total)}
              {quiz.generic && <span className="text-muted">{t.quizGeneric}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setQuizOpen(true); iframeRef.current?.contentWindow?.postMessage({ type: 'sp-reset' }, window.location.origin) }} className="px-4 py-2 text-xs font-semibold rounded-pill border border-hairline bg-white">{t.quizAgain}</button>
              <button onClick={() => { setQuiz(null); setOpen(null) }} className="px-4 py-2 text-xs font-semibold rounded-pill bg-navy text-white">{t.quizBack}</button>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium text-muted mb-1">{t.sort}</label>
              <select className={inp} value={quizSort} onChange={(e) => { setQuizSort(e.target.value); setQuizPage(1); setOpen(null) }}>
                <option value="rel">{t.sortRel}</option><option value="rank">{t.sortRank}</option><option value="tuition">{t.sortTuition}</option>
                <option value="duration">{t.sortDur}</option><option value="ielts">{t.sortIelts}</option><option value="name">{t.sortName}</option>
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium text-muted mb-1">{t.dirLabel}</label>
              <select className={inp} value={quizDir} onChange={(e) => { setQuizDir(e.target.value); setQuizPage(1); setOpen(null) }}>
                <option value="asc">{t.dirAsc}</option><option value="desc">{t.dirDesc}</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">{sortQuiz(quiz.rows, quizSort, quizDir).slice((quizPage - 1) * quizPer, quizPage * quizPer).map(ProgCard)}</div>
          {quizPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={quizPage <= 1} onClick={() => { setQuizPage(quizPage - 1); setOpen(null) }} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">{t.prev}</button>
              <span className="text-sm text-muted">{quizPage} / {quizPages}</span>
              <button disabled={quizPage >= quizPages} onClick={() => { setQuizPage(quizPage + 1); setOpen(null) }} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">{t.next}</button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {(['program', 'beasiswa'] as const).map((k) => (
              <button key={k} onClick={() => { setTab(k); setPage(1); setRes(null); setF({ ...f, sort: k === 'program' ? 'rank' : 'amount', dir: k === 'program' ? 'asc' : 'desc' }) }} className={`px-4 py-2 rounded-pill text-sm font-semibold border ${tab === k ? 'bg-navy text-white border-navy' : 'bg-white text-ink border-hairline'}`}>
                {k === 'program' ? T[lang].tabProgram : T[lang].tabSch}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-hairline p-4 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">{t.level}</label>
              <select className={inp} value={f.level} onChange={(e) => set({ level: e.target.value })}>
                <option value="all">{t.allLevels} ({meta?.stats.programs.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')})</option>
                {meta?.levels.map((l) => <option key={l.key} value={l.key}>{l.label} ({l.count.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID')})</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <NameSearch label={t.search(tab === 'program')} value={f.q} suggest={tab === 'program' ? suggestNames : null}
                placeholder={t.searchPh(tab === 'program')} onChange={(q) => set({ q })} />
            </div>
            <Suggest label={t.campus} items={uniItems} value={f.uniLabel} placeholder={t.campusPh} onPick={(key, label) => set({ uni: key, uniLabel: label })} />
            {tab === 'program' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.field}</label>
                  <select className={inp} value={f.topic} onChange={(e) => set({ topic: e.target.value })}>
                    <option value="">{t.allFields}</option>
                    {meta?.topics.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.state}</label>
                  <select className={inp} value={f.state} onChange={(e) => set({ state: e.target.value })}>
                    <option value="">{t.allStates}</option>
                    {meta?.states.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
                  </select>
                </div>
                <Suggest label={t.city} items={cityItems} value={f.city} placeholder={t.cityPh} onPick={(key) => set({ city: key })} />
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.ielts}</label>
                  <select className={inp} value={f.maxIelts} onChange={(e) => set({ maxIelts: e.target.value })}>
                    <option value="">{t.all}</option>
                    {[5.5, 6, 6.5, 7, 7.5].map((v) => <option key={v} value={v}>{fmt1(v)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.tuitionMax}</label>
                  <select className={inp} value={f.maxTuition} onChange={(e) => set({ maxTuition: e.target.value })}>
                    <option value="">{t.all}</option>
                    {[20000, 40000, 60000, 80000, 120000].map((v) => <option key={v} value={v}>≤ {v.toLocaleString('id-ID')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.sort}</label>
                  <select className={inp} value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                    <option value="rank">{t.sortRank}</option>
                    <option value="tuition">{t.sortTuition}</option>
                    <option value="duration">{t.sortDur}</option>
                    <option value="ielts">{t.sortIelts}</option>
                    <option value="name">{t.sortName}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.dirLabel}</label>
                  <select className={inp} value={f.dir} onChange={(e) => set({ dir: e.target.value })}>
                    <option value="asc">{t.dirAsc}</option>
                    <option value="desc">{t.dirDesc}</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-ink pt-5">
                  <input type="checkbox" checked={f.aas} onChange={(e) => set({ aas: e.target.checked })} /> {t.aasOnly}
                </label>
              </>
            )}
            {tab === 'beasiswa' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.sort}</label>
                  <select className={inp} value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
                    <option value="amount">{t.sortAmount}</option>
                    <option value="deadline">{t.sortDeadline}</option>
                    <option value="name">{t.sortName}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">{t.dirLabel}</label>
                  <select className={inp} value={f.dir} onChange={(e) => set({ dir: e.target.value })}>
                    <option value="asc">{t.dirAsc}</option>
                    <option value="desc">{t.dirDesc}</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-muted mb-3">{busy ? t.searching : res ? t.results(res.total.toLocaleString(lang === 'en' ? 'en-US' : 'id-ID'), res.page, pages) : ''}{tab === 'program' && t.curatedNote}</div>

          <div className="space-y-3">
            {tab === 'program' && (res?.rows as Prog[] | undefined)?.map(ProgCard)}
            {tab === 'beasiswa' && (res?.rows as Sch[] | undefined)?.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-hairline p-4">
                <button className="w-full text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <div className="font-semibold text-ink">{s.name}</div>
                  <div className="text-sm text-muted">{s.unis.join(', ') || '—'}</div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink">
                    <span>💰 {s.amountAnnual ? `${aud(s.amountAnnual)}/${t.perYear}` : s.amountMax ? `${t.upTo} ${aud(s.amountMax)}` : s.amountNote || t.amountNone}</span>
                    {s.closing && <span>⏰ {t.closes} {s.closing}</span>}
                    {s.perYear && <span>🎓 {t.recipients(s.perYear)}</span>}
                    {s.researchOnly && <span>🔬 {t.researchOnly}</span>}
                  </div>
                </button>
                {open === s.id && (
                  <div className="mt-3 pt-3 border-t border-hairline text-sm space-y-2">
                    {s.citizenship && <div><span className="text-muted">{t.citizenship}</span> {s.citizenship}</div>}
                    {s.eligibility && <div><span className="text-muted">{t.eligibility}</span> {s.eligibility.replace(/;\s*/g, '; ')}</div>}
                    {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-navy text-white px-4 py-2 rounded-pill text-xs font-semibold">{t.officialSch}</a>}
                    <div className="text-xs text-muted">{t.checkSch}</div>
                  </div>
                )}
              </div>
            ))}
            {res && res.rows.length === 0 && <div className="text-sm text-muted p-6 text-center">{t.none}</div>}
          </div>

          {res && pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">{t.prev}</button>
              <span className="text-sm text-muted">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-4 py-2 text-sm rounded-pill border border-hairline bg-white disabled:opacity-40">{t.next}</button>
            </div>
          )}
        </>
      )}
      <p className="text-xs text-muted mt-8">{t.disclaimer}</p>

      {/* Kuis 7 pertanyaan (iframe satu origin; hasilnya dikirim lewat postMessage) */}
      <div className={quizOpen ? 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3' : 'hidden'}>
        <div className="bg-off rounded-2xl w-full max-w-lg h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-white">
            <b className="text-sm">{t.quizTitle}</b>
            <button onClick={() => setQuizOpen(false)} className="text-muted text-xl leading-none px-2" aria-label="Close">×</button>
          </div>
          {quizBusy && <div className="px-4 py-2 text-xs text-muted bg-white">{t.quizBusy}</div>}
          <iframe key={lang} ref={iframeRef} src={lang === 'en' ? '/planner-quiz-en.html' : '/planner-quiz.html'} title="Study Planner quiz" className="flex-1 w-full border-0" />
        </div>
      </div>
    </div>
  )
}
