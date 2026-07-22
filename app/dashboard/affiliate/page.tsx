'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/lib/use-user'

type Affiliate = {
  id: string
  referral_code: string
  commission_rate: number
  total_earned: number
  total_paid: number
  status: string
}
type Referral = { id: string; clicked_at: string; converted_at: string | null; commission_earned: number | null; payout_status: string }
type Stats = { clicks: number; conversions: number; pendingCommission: number }

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://awardee.id'

export default function AffiliatePage() {
  const { user, loading } = useUser()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const supabase = createClient()

  async function loadAffiliate() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/affiliate', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setAffiliate(data.affiliate)
      setReferrals(data.referrals || [])
      setStats(data.stats)
    }
    setPageLoading(false)
  }

  useEffect(() => { if (!loading) loadAffiliate() }, [loading])

  async function handleJoin() {
    setJoining(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (res.ok) {
      setAffiliate(data.affiliate)
      setStats({ clicks: 0, conversions: 0, pendingCommission: 0 })
    }
    setJoining(false)
  }

  async function copyLink() {
    if (!affiliate) return
    const link = `${BASE_URL}/?ref=${affiliate.referral_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-muted text-sm">Memuat...</div></div>
  }

  const referralLink = affiliate ? `${BASE_URL}/?ref=${affiliate.referral_code}` : ''

  return (
    <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink">Afiliasi & Komisi</h1>
        <p className="text-sm text-muted mt-0.5">Ajak teman daftar AWARDEE APP, dapatkan komisi 20% dari setiap subscription yang berhasil.</p>
      </div>

      {!affiliate ? (
        <div className="bg-white rounded-xl border border-hairline p-8 text-center">
          <div className="text-4xl mb-3">🤝</div>
          <h2 className="font-semibold text-ink text-lg mb-2">Bergabung Program Afiliasi</h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Dapatkan <strong>komisi 20%</strong> untuk setiap orang yang daftar paket berbayar melalui link kamu.
            Starter Rp99K → kamu dapat Rp19.800. Pro Rp299K → kamu dapat Rp59.800.
          </p>
          <button
            onClick={handleJoin}
            disabled={joining}
            className="bg-navy hover:bg-navy-2 disabled:bg-hairline text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            {joining ? 'Mendaftarkan...' : 'Daftar Jadi Afiliasi'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {affiliate.status === 'suspended' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              Akun afiliasi kamu sedang disuspend. Hubungi DenDhana untuk informasi lebih lanjut.
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-2xl font-bold text-ink">{stats?.clicks ?? 0}</div>
              <div className="text-xs text-muted mt-1">Total klik link</div>
            </div>
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-2xl font-bold text-green-600">{stats?.conversions ?? 0}</div>
              <div className="text-xs text-muted mt-1">Konversi berhasil</div>
            </div>
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-xl font-bold text-gold-2">Rp {Number(affiliate.total_earned).toLocaleString('id-ID')}</div>
              <div className="text-xs text-muted mt-1">Total komisi earned</div>
            </div>
            <div className="bg-white rounded-xl border border-hairline p-4">
              <div className="text-xl font-bold text-purple-600">Rp {Number(stats?.pendingCommission ?? 0).toLocaleString('id-ID')}</div>
              <div className="text-xs text-muted mt-1">Menunggu pembayaran</div>
            </div>
          </div>

          {/* Referral link */}
          <div className="bg-off border border-gold rounded-xl p-4">
            <div className="text-sm font-medium text-ink mb-2">Link Referral Kamu</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-white border border-gold rounded-lg px-3 py-2.5 text-navy font-mono truncate">
                {referralLink}
              </code>
              <button
                onClick={copyLink}
                className="bg-navy hover:bg-navy-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-colors"
              >
                {copied ? 'Tersalin ✓' : 'Salin'}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              Kode referral kamu: <strong className="font-mono">{affiliate.referral_code}</strong> · Komisi: {affiliate.commission_rate}%
            </p>
          </div>

          {/* Referral history */}
          <div className="bg-white rounded-xl border border-hairline p-5">
            <h2 className="font-semibold text-ink text-sm mb-3">Riwayat Referral</h2>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted">Belum ada referral. Share link kamu dan mulai dapatkan komisi!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-hairline">
                      <th className="pb-2 pr-4">Tanggal Klik</th>
                      <th className="pb-2 pr-4">Konversi</th>
                      <th className="pb-2 pr-4 text-right">Komisi</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id} className="border-b border-hairline">
                        <td className="py-2 pr-4 text-muted">{new Date(r.clicked_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-2 pr-4 text-muted">{r.converted_at ? new Date(r.converted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}</td>
                        <td className="py-2 pr-4 text-right font-semibold text-ink">
                          {r.commission_earned ? `Rp ${Number(r.commission_earned).toLocaleString('id-ID')}` : '—'}
                        </td>
                        <td className="py-2">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            r.payout_status === 'paid' ? 'bg-green-100 text-green-700' :
                            r.payout_status === 'approved' ? 'bg-off text-navy' :
                            r.converted_at ? 'bg-yellow-100 text-yellow-700' :
                            'bg-off text-muted'
                          }`}>
                            {r.payout_status === 'paid' ? 'Dibayar' :
                             r.payout_status === 'approved' ? 'Disetujui' :
                             r.converted_at ? 'Pending' : 'Klik saja'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
