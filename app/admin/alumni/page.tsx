'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type AlumniRow = {
  id: string
  scholarship_name: string
  university: string | null
  graduation_year: number | null
  story: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  contribution_count: number
  contribution_hours: number
  profiles: { id: string; name: string; email: string } | null
}

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniRow[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/alumni', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const data = await res.json()
      setAlumni(data.alumni || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAction(alumniId: string, action: 'approve' | 'reject') {
    setUpdating(alumniId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/admin/alumni', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ alumniId, action }),
    })
    await load()
    setUpdating(null)
  }

  if (loading) return <div className="p-8 text-gray-400 text-sm">Memuat data alumni...</div>

  const pending = alumni.filter(a => a.status === 'pending')
  const approved = alumni.filter(a => a.status === 'approved')
  const rejected = alumni.filter(a => a.status === 'rejected')

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Awardee Alumni ({alumni.length})</h1>
        <p className="text-sm text-gray-500">
          {approved.length} aktif · {approved.reduce((s, a) => s + a.contribution_count, 0)} kontribusi tercatat · {approved.reduce((s, a) => s + a.contribution_hours, 0)} jam total
        </p>
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Menunggu Review ({pending.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {pending.map(a => (
              <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{a.profiles?.name ?? 'Unknown'} <span className="text-xs text-gray-400 font-normal">{a.profiles?.email}</span></div>
                  <div className="text-sm text-gray-600 mt-0.5">{a.scholarship_name}{a.university ? ` · ${a.university}` : ''}{a.graduation_year ? ` · ${a.graduation_year}` : ''}</div>
                  {a.story && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{a.story}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(a.id, 'approve')} disabled={updating === a.id}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                    Setujui
                  </button>
                  <button onClick={() => handleAction(a.id, 'reject')} disabled={updating === a.id}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Alumni Aktif ({approved.length})</h2>
        {approved.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">Belum ada alumni aktif.</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Beasiswa</th>
                    <th className="px-4 py-3 text-center">Kontribusi</th>
                    <th className="px-4 py-3 text-center">Jam</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map(a => (
                    <tr key={a.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.profiles?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.scholarship_name}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gold-2">{a.contribution_count}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{a.contribution_hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {rejected.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Ditolak ({rejected.length})</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {rejected.map(a => (
              <div key={a.id} className="p-4 text-sm text-gray-500">{a.profiles?.name ?? 'Unknown'} · {a.scholarship_name}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
