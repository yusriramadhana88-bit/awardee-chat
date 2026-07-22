'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Affiliate = {
  id: string
  referral_code: string
  commission_rate: number
  total_earned: number
  total_paid: number
  status: 'active' | 'suspended'
  created_at: string
  clicks: number
  conversions: number
  pending_payouts: number
  profiles: { id: string; name: string } | null
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  async function loadAffiliates() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/affiliates', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setAffiliates(data.affiliates || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadAffiliates() }, [])

  async function toggleStatus(affiliateId: string) {
    setUpdating(affiliateId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/admin/affiliates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'toggle_status', affiliateId }),
    })
    await loadAffiliates()
    setUpdating(null)
  }

  if (loading) return <div className="p-8 text-muted text-sm">Memuat data afiliasi...</div>

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold text-ink mb-2">Program Afiliasi ({affiliates.length})</h1>
      <p className="text-sm text-muted mb-6">Komisi default 20% dari nilai subscription konversi.</p>

      {affiliates.length === 0 ? (
        <div className="bg-white rounded-xl border border-hairline p-10 text-center text-muted text-sm">
          Belum ada afiliasi terdaftar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-off border-b border-hairline">
                <tr className="text-left text-xs text-muted">
                  <th className="px-4 py-3">Afiliasi</th>
                  <th className="px-4 py-3">Kode Referral</th>
                  <th className="px-4 py-3 text-center">Klik</th>
                  <th className="px-4 py-3 text-center">Konversi</th>
                  <th className="px-4 py-3 text-right">Komisi Earned</th>
                  <th className="px-4 py-3 text-right">Sudah Dibayar</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map(a => (
                  <tr key={a.id} className="border-b border-hairline hover:bg-off">
                    <td className="px-4 py-3 font-medium text-ink">{a.profiles?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-off text-ink px-2 py-1 rounded">{a.referral_code}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted">{a.clicks}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-green-600">{a.conversions}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      Rp {Number(a.total_earned).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      Rp {Number(a.total_paid).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {a.status === 'active' ? 'Aktif' : 'Suspend'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(a.id)}
                        disabled={updating === a.id}
                        className="text-xs text-muted hover:text-ink disabled:opacity-50"
                      >
                        {a.status === 'active' ? 'Suspend' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
