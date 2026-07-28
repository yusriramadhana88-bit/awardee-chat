'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Stats = {
  total: number
  free: number
  starter: number
  vip: number
  vvip: number
  chatToday: number
  topAffiliates: { name: string; code: string; conversions: number; earned: number }[]
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const [usersRes, affiliatesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('/api/admin/affiliates', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ])

      const { users = [] } = usersRes.ok ? await usersRes.json() : {}
      const { affiliates = [] } = affiliatesRes.ok ? await affiliatesRes.json() : {}

      setStats({
        total: users.length,
        free: users.filter((u: any) => u.subscription_tier === 'free').length,
        starter: users.filter((u: any) => u.subscription_tier === 'starter').length,
        vip: users.filter((u: any) => u.subscription_tier === 'vip').length,
        vvip: users.filter((u: any) => u.subscription_tier === 'vvip').length,
        chatToday: users.reduce((sum: number, u: any) => sum + (u.chat_today ?? 0), 0),
        topAffiliates: affiliates.slice(0, 5).map((a: any) => ({
          name: a.profiles?.name ?? 'Unknown',
          code: a.referral_code,
          conversions: a.conversions,
          earned: a.total_earned,
        })),
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 text-muted text-sm">Memuat statistik...</div>
  if (!stats) return <div className="p-8 text-red-500 text-sm">Gagal memuat data.</div>

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-ink mb-6">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total User', value: stats.total, color: 'text-ink' },
          { label: 'Free', value: stats.free, color: 'text-muted' },
          { label: 'Starter', value: stats.starter, color: 'text-amber-700' },
          { label: 'VIP', value: stats.vip, color: 'text-gold-2' },
          { label: 'VVIP', value: stats.vvip, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-hairline p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-hairline p-5">
          <h2 className="font-semibold text-ink text-sm mb-3">Chat hari ini (semua user)</h2>
          <div className="text-4xl font-bold text-gold-2">{stats.chatToday}</div>
          <div className="text-xs text-muted mt-1">total pesan terkirim ke AI hari ini</div>
        </div>

        <div className="bg-white rounded-xl border border-hairline p-5">
          <h2 className="font-semibold text-ink text-sm mb-3">Top Afiliasi</h2>
          {stats.topAffiliates.length === 0 ? (
            <p className="text-sm text-muted">Belum ada afiliasi.</p>
          ) : (
            <div className="space-y-2">
              {stats.topAffiliates.map(a => (
                <div key={a.code} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-ink">{a.name}</span>
                    <span className="ml-2 text-xs text-muted font-mono">{a.code}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-600 font-semibold">Rp {a.earned.toLocaleString('id-ID')}</div>
                    <div className="text-xs text-muted">{a.conversions} konversi</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
