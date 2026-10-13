'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Meta = {
  levels: { key: string; label: string; count: number }[]
  topics: { key: string; label: string }[]
  cities: string[]
  unis: { i: number; n: string; k: number; aas: boolean }[]
  stats: { programs: number; institutions: number; universities: number; scholarships: number; snapshot: string }
}
type Prog = {
  id: number; name: string; level: string; codes: string[]; providerCode: string; url: string; urlType: string
  uni: { i: number; name: string; curated: boolean; aas: boolean; qs: { rank: string } | null; the: { rank: string } | null; intlPct: number | null }
  cities: string[]; years: number | null; tuitionTotal: number | null; tuitionPerYear: number | null
  ielts: { overall: number; band: number | null; src: string } | null; intakes: string[]; intakeFromData: boolean
  topics: string[]; priority: boolean; careers: { title: string; medianWeekly: number | null }[]; schCount: number
}
type Sch = {
  id: string; name: string; unis: string[]; amountAnnual: number | null; amountMax: number | null; amountNote: string | null
  perYear: number | null; closing: string | null; eligibility: string; citizenship: string | null; researchOnly: boolean; url: string | null
}
type Gate = { state: 'loading' } | { state: 'ok' } | { state: 'locked'; buyUrl: string; waNumber: string; email: string } | { state: 'error'; msg: string }

const aud = (n: number) => 'AUD ' + Math.round(n).toLocaleString('id-ID')
const fmt1 = (n: number) => String(n).replace('.', ',')
const rk = (r: string) => (/^\d+$/.test(r) ? '#' + r : r)

export default function StudyPlannerDbPage() {
  const supabase = createClient()
  const [gate, setGate] = useState<Gate>({ state: 'loading' })
  const [meta, setMeta] = useState<Meta | null>(null)
  const [tab, setTab] = useState<'program' | 'beasiswa'>('program')
  const [f, setF] = useState({ level: 's2', q: '', topic: '', city: '', uni: '', aas: false, maxIelts: '', maxTuition: '', sort: 'rank' })
  const [page, setPage] = useState(1)
  const [res, setRes] = useState<{ total: number; page: number; perPage: number; rows: any[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<number | string | null>(null)
  const [copied, setCopied] = useState('')

  const api = useCallback(async (qs: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/login'; return null }
    const r = await fetch('/api/study-planner/db?' + qs, { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (r.status === 403) { const j = await r.json(); setGate({ state: 'locked', buyUrl: j.buyUrl, waNumber: j.waNumber, email: j.email }); return null }
    if (!r.ok) { setGate({ state: 'error', msg: 'Gagal memuat database. Muat ulang halaman.' }); return null }
    return r.json()
  }, [supabase])

  useEffect(() => { api('mode=meta').then((m) => { if (m) { setMeta(m); setGate({ state: 'ok' }) } }) }, [api])

  useEffect(() => {
    if (gate.state !== 'ok') return
    const p = new URLSearchParams()
    if (tab === 'program') {
      p.set('level', f.level); p.set('sort', f.sort); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.topic) p.set('topic', f.topic); if (f.city) p.set('city', f.city)
      if (f.uni) p.set('uni', f.uni); if (f.aas) p.set('aas', '1'); if (f.maxIelts) p.set('maxIelts', f.maxIelts); if (f.maxTuition) p.set('maxTuition', f.maxTuition)
    } else {
      p.set('mode', 'scholarships'); p.set('level', f.level === 's2' || f.level === 's3' ? 'pg' : 'ug'); p.set('page', String(page))
      if (f.q) p.set('q', f.q); if (f.uni) p.set('uni', f.uni)
    }
    setBusy(true)
    const t = setTimeout(() => { api(p.toString()).then((r) => { if (r) { setRes(r); setOpen(null) } setBusy(false) }) }, 250)
    return () => clearTimeout(t)
  }, [gate.state, tab, f, page, api])

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

  const inp = 'w-full border border-hairline rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold'
  const pages = res ? Math.max(1, Math.ceil(res.total / res.perPage)) : 1

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Database STUDY PLANNER</h1>
        <p className="text-sm text-muted mt-0.5">
          {meta && <>{meta.stats.programs.toLocaleString('id-ID')} program · {meta.stats.institutions} institusi · {meta.stats.universities} universitas · {meta.stats.scholarships} beasiswa pascasarjana · data {meta.stats.snapshot}</>}
        </p>
      </div>

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
            {meta?.levels.map((l) => <option key={l.key} value={l.key}>{l.label} ({l.count.toLocaleString('id-ID')})</option>)}
          </select>
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <label className="block text-xs font-medium text-muted mb-1">Cari {tab === 'program' ? 'nama program / kampus' : 'beasiswa'}</label>
          <input className={inp} value={f.q} placeholder={tab === 'program' ? 'mis. public policy, data science, nursing' : 'mis. women, merit, engineering'} onChange={(e) => set({ q: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Kampus</label>
          <select className={inp} value={f.uni} onChange={(e) => set({ uni: e.target.value })}>
            <option value="">Semua kampus</option>
            {meta?.unis.map((u) => <option key={u.i} value={u.i}>{u.n}{u.k === 2 ? ' ★' : ''}</option>)}
          </select>
        </div>
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
              <label className="block text-xs font-medium text-muted mb-1">Kota</label>
              <select className={inp} value={f.city} onChange={(e) => set({ city: e.target.value })}>
                <option value="">Semua kota</option>
                {meta?.cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
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
        {tab === 'program' && (res?.rows as Prog[] | undefined)?.map((p) => (
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
                {p.schCount > 0 && <div><button className="underline" onClick={() => { setTab('beasiswa'); set({ uni: String(p.uni.i), q: '' }) }}>Lihat {p.schCount} beasiswa pascasarjana di {p.uni.name} →</button></div>}
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-navy text-white px-4 py-2 rounded-pill text-xs font-semibold">Halaman resmi program ({p.urlType}) ↗</a>
              </div>
            )}
          </div>
        ))}

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
      <p className="text-xs text-muted mt-8">Angka biaya adalah estimasi biaya kuliah saja (belum termasuk biaya hidup). Selalu verifikasi syarat bahasa, biaya, dan jadwal di halaman resmi kampus sebelum mendaftar.</p>
    </div>
  )
}
