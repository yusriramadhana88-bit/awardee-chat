'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Lead = { id: string; name: string; phone: string; email: string; source: string; created_at: string }

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/admin/leads', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) setLeads((await res.json()).leads)
      setLoading(false)
    }
    load()
  }, [])

  function exportCsv() {
    const header = 'name,phone,email,source,created_at\n'
    const rows = leads.map(l =>
      [l.name, l.phone, l.email, l.source, l.created_at].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `member-leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat leads...</div></div>
  }

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl lg:text-2xl font-bold text-ink">Member Leads</h1>
        <button
          onClick={exportCsv}
          disabled={leads.length === 0}
          className="text-sm font-semibold bg-navy hover:bg-navy-2 disabled:opacity-40 text-white px-4 py-2 rounded-xl transition-colors"
        >
          Export CSV
        </button>
      </div>
      <p className="text-sm text-muted mb-6">
        Nama, WA, dan email dari form &quot;sneak peek member area&quot; di awardee.id — pakai Export CSV untuk upload ke Custom Audience Meta/Google Ads atau tools email marketing.
      </p>

      <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
        <div className="text-2xl font-bold text-gold-2">{leads.length}</div>
        <div className="text-xs text-muted mt-1">Total lead terkumpul</div>
      </div>

      <div className="bg-white rounded-xl border border-hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline text-left text-xs text-muted">
              <th className="p-3">Nama</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3">Email</th>
              <th className="p-3">Sumber</th>
              <th className="p-3">Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id} className="border-b border-hairline last:border-0">
                <td className="p-3 text-ink font-medium">{l.name}</td>
                <td className="p-3 text-ink">
                  <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-gold-2 hover:underline">
                    {l.phone}
                  </a>
                </td>
                <td className="p-3 text-ink">{l.email}</td>
                <td className="p-3 text-muted">{l.source}</td>
                <td className="p-3 text-muted">{new Date(l.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted text-sm">Belum ada lead masuk.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
