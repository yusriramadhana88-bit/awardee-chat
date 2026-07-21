'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type User = {
  id: string
  name: string
  email: string | null
  phone: string | null
  subscription_tier: 'free' | 'starter' | 'pro'
  subscription_expires_at: string | null
  is_admin: boolean
  chat_today: number
  created_at: string
}

const TIER_COLORS = {
  free: 'text-gray-600 bg-gray-100',
  starter: 'text-navy bg-off',
  pro: 'text-purple-700 bg-purple-100',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  async function loadUsers() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users || [])
    }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleTierChange(userId: string, tier: 'free' | 'starter' | 'pro') {
    setUpdating(userId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ userId, tier }),
    })
    await loadUsers()
    setUpdating(null)
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  )

  if (loading) return <div className="p-8 text-gray-400 text-sm">Memuat data user...</div>

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Kelola User ({users.length})</h1>
        <input
          type="text"
          placeholder="Cari nama, email, atau HP..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold w-64"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">HP</th>
                <th className="px-4 py-3 text-center">Chat Hari Ini</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Bergabung</th>
                <th className="px-4 py-3">Ubah Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.name}
                    {u.is_admin && <span className="ml-1.5 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">ADMIN</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gold-2">{u.chat_today}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${TIER_COLORS[u.subscription_tier]}`}>
                      {u.subscription_tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    {!u.is_admin && (
                      <select
                        value={u.subscription_tier}
                        onChange={e => handleTierChange(u.id, e.target.value as 'free' | 'starter' | 'pro')}
                        disabled={updating === u.id}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50"
                      >
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Tidak ada user ditemukan.</p>
        )}
      </div>
    </div>
  )
}
