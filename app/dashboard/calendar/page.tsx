'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser, canAccess } from '@/lib/use-user'
import FeatureLock from '../_components/FeatureLock'

type CalEvent = {
  id: string
  title: string
  date: string // YYYY-MM-DD
  category: 'deadline' | 'test' | 'interview' | 'document' | 'other' | 'application' | 'global'
  source: 'application' | 'custom' | 'global'
  url?: string
  confidence?: 'confirmed' | 'estimated'
}

type UnscheduledScholarship = {
  id: string
  name: string
  label: string
  note: string | null
  url: string
}

const CATEGORY_LABEL: Record<string, string> = {
  deadline: 'Deadline',
  test: 'Tes Bahasa',
  interview: 'Interview',
  document: 'Dokumen',
  other: 'Lainnya',
  application: 'Aplikasi Beasiswa',
  global: 'Beasiswa Global',
}

const CATEGORY_COLOR: Record<string, string> = {
  deadline: 'bg-red-100 text-red-700',
  test: 'bg-purple-100 text-purple-700',
  interview: 'bg-amber-100 text-amber-700',
  document: 'bg-off text-navy',
  other: 'bg-off text-ink',
  application: 'bg-green-100 text-green-700',
  global: 'bg-indigo-100 text-indigo-700',
}

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { user, loading } = useUser()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [unscheduled, setUnscheduled] = useState<UnscheduledScholarship[]>([])
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string>(toDateKey(new Date()))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: toDateKey(new Date()), category: 'deadline' as CalEvent['category'] })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const tier = user?.tier || 'free'
  const allowed = canAccess(tier, 'starter')

  useEffect(() => {
    if (!allowed) return
    loadEvents()
  }, [allowed])

  async function loadEvents() {
    const [appsRes, evRes, globalRes] = await Promise.all([
      supabase.from('scholarship_applications').select('id, name, deadline').eq('status', 'active'),
      supabase.from('calendar_events').select('*').order('event_date', { ascending: true }),
      supabase.from('scholarship_deadlines').select('id, deadline_date, deadline_label, cycle_pattern_note, confidence, scholarship:scholarships(id, name, official_url)'),
    ])

    const fromApps: CalEvent[] = (appsRes.data || [])
      .filter((a: any) => a.deadline)
      .map((a: any) => ({ id: `app-${a.id}`, title: a.name, date: a.deadline, category: 'application', source: 'application' as const }))

    const fromEvents: CalEvent[] = (evRes.data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.event_date,
      category: e.category,
      source: 'custom' as const,
    }))

    const globalRows = (globalRes.data || []) as any[]
    const fromGlobal: CalEvent[] = globalRows
      .filter(g => g.deadline_date && g.scholarship)
      .map(g => ({
        id: `global-${g.id}`,
        title: `${g.scholarship.name} — ${g.deadline_label}`,
        date: g.deadline_date,
        category: 'global' as const,
        source: 'global' as const,
        url: g.scholarship.official_url,
        confidence: g.confidence,
      }))

    setUnscheduled(
      globalRows
        .filter(g => !g.deadline_date && g.scholarship)
        .map(g => ({ id: g.id, name: g.scholarship.name, label: g.deadline_label, note: g.cycle_pattern_note, url: g.scholarship.official_url }))
    )

    setEvents([...fromApps, ...fromEvents, ...fromGlobal])
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSaving(false)
      return
    }

    await supabase.from('calendar_events').insert({
      user_id: session.user.id,
      title: form.title.trim(),
      event_date: form.date,
      category: form.category,
    })

    setForm({ title: '', date: form.date, category: 'deadline' })
    setShowForm(false)
    setSaving(false)
    loadEvents()
  }

  async function handleDelete(id: string) {
    await supabase.from('calendar_events').delete().eq('id', id)
    loadEvents()
  }

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = []
      map[ev.date].push(ev)
    }
    return map
  }, [events])

  const calendarDays = useMemo(() => {
    const year = current.getFullYear()
    const month = current.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    const days: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [current])

  const todayKey = toDateKey(new Date())
  const selectedEvents = eventsByDate[selectedDate] || []

  // Upcoming list (next 60 days)
  const upcoming = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return [...events]
      .filter(e => {
        const d = new Date(e.date)
        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 60
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8)
  }, [events])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  if (!allowed) {
    return <FeatureLock requiredTier="starter" featureName="Kalender Beasiswa" />
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ink">Kalender Beasiswa</h1>
          <p className="text-sm text-muted mt-0.5">Semua deadline penting dalam satu tampilan personal.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-navy text-white text-sm px-4 py-2 rounded-xl font-medium hover:bg-navy-2 transition-colors"
        >
          + Tambah Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddEvent} className="bg-white rounded-xl border border-hairline p-4 mb-6 grid sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted mb-1">Judul</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Tes IELTS, Submit LoA"
              required
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Kategori</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as CalEvent['category'] })}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="deadline">Deadline</option>
              <option value="test">Tes Bahasa</option>
              <option value="interview">Interview</option>
              <option value="document">Dokumen</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
          <div className="sm:col-span-4 flex gap-2">
            <button type="submit" disabled={saving} className="bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:bg-hairline">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted px-4 py-2">Batal</button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-hairline p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-off text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06z" /></svg>
            </button>
            <h2 className="font-semibold text-ink">{MONTH_NAMES[current.getMonth()]} {current.getFullYear()}</h2>
            <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-off text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.21 5.23a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.04-1.08L12.168 10 8.23 6.29a.75.75 0 01-.02-1.06z" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={i} />
              const key = toDateKey(day)
              const dayEvents = eventsByDate[key] || []
              const isToday = key === todayKey
              const isSelected = key === selectedDate
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(key)}
                  className={`aspect-square rounded-lg p-1 text-left flex flex-col gap-0.5 border transition-colors ${
                    isSelected ? 'border-gold bg-off' : isToday ? 'border-gold bg-off/50' : 'border-transparent hover:bg-off'
                  }`}
                >
                  <span className={`text-xs ${isToday ? 'font-bold text-gold-2' : 'text-ink'}`}>{day.getDate()}</span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span key={ev.id} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_COLOR[ev.category].split(' ')[0]}`} />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-hairline p-4">
            <h3 className="font-semibold text-ink text-sm mb-3">
              {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted">Tidak ada agenda.</p>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[ev.category]}`}>{CATEGORY_LABEL[ev.category]}</span>
                      {ev.confidence === 'estimated' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-off text-muted ml-1">~perkiraan</span>
                      )}
                      <p className="text-sm text-ink mt-1 truncate">{ev.title}</p>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-2 hover:underline">
                          Info resmi →
                        </a>
                      )}
                    </div>
                    {ev.source === 'custom' && (
                      <button onClick={() => handleDelete(ev.id)} className="text-muted hover:text-red-500 transition-colors shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" /></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-hairline p-4">
            <h3 className="font-semibold text-ink text-sm mb-3">Mendatang (60 hari)</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">Belum ada agenda mendatang.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">{ev.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLOR[ev.category]}`}>{CATEGORY_LABEL[ev.category]}</span>
                      {ev.confidence === 'estimated' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-off text-muted ml-1">~perkiraan</span>
                      )}
                    </div>
                    <span className="text-xs text-muted shrink-0">{new Date(ev.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {unscheduled.length > 0 && (
            <div className="bg-white rounded-xl border border-hairline p-4">
              <h3 className="font-semibold text-ink text-sm mb-1">Prediksi Siklus Beasiswa Lainnya</h3>
              <p className="text-xs text-muted mb-3">Beasiswa ini belum umumkan tanggal pasti — perkiraan berdasarkan pola siklus tahun sebelumnya.</p>
              <div className="space-y-3">
                {unscheduled.map(s => (
                  <div key={s.id} className="border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                    <p className="text-sm font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-muted mt-0.5">{s.label}</p>
                    {s.note && <p className="text-xs text-muted mt-1">{s.note}</p>}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-2 hover:underline">Info resmi →</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
