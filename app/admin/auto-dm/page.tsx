'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

type Rule = {
  id: string
  trigger_keyword: string
  reply_message: string
  dm_message: string
  active: boolean
  created_at: string
}

type LogRow = {
  id: string
  ig_comment_id: string
  commenter_username: string | null
  reply_ok: boolean
  dm_ok: boolean
  error: string | null
  processed_at: string
}

const EMPTY_FORM = { triggerKeyword: '', replyMessage: '', dmMessage: '' }

export default function AutoDmAdminPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [log, setLog] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/auto-dm', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const data = await res.json()
      setRules(data.rules || [])
      setLog(data.log || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCreating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/admin/auto-dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setForm(EMPTY_FORM)
      await load()
    } else {
      setError(data.error || 'Gagal membuat rule.')
    }
    setCreating(false)
  }

  async function toggleActive(rule: Rule) {
    setUpdating(rule.id)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch('/api/admin/auto-dm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ruleId: rule.id, active: !rule.active }),
    })
    await load()
    setUpdating(null)
  }

  async function handleDelete(ruleId: string) {
    setUpdating(ruleId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await fetch(`/api/admin/auto-dm?id=${ruleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    await load()
    setUpdating(null)
  }

  if (loading) return <div className="p-8 text-muted text-sm">Memuat auto-DM rules...</div>

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-ink mb-2">Auto-Reply & Auto-DM Instagram</h1>
      <p className="text-sm text-muted mb-6">
        Kalau ada yang comment kata kunci di bawah pada post/reel Instagram, bot otomatis balas comment-nya secara publik
        + kirim DM privat (via Instagram Private Replies API). Butuh webhook Instagram sudah aktif — lihat{' '}
        <code className="bg-off px-1 rounded">INSTAGRAM_AUTO_DM_SETUP.md</code> di root project untuk setup Meta App-nya.
      </p>

      <form onSubmit={handleCreate} className="bg-white rounded-xl border border-hairline p-5 mb-6 space-y-3">
        <h2 className="font-semibold text-ink text-sm">Tambah Rule Baru</h2>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Kata Kunci Trigger (case-insensitive)</label>
          <input
            type="text"
            value={form.triggerKeyword}
            onChange={e => setForm(f => ({ ...f, triggerKeyword: e.target.value }))}
            placeholder="Contoh: MAU"
            required
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Balasan Publik (muncul di bawah comment)</label>
          <textarea
            value={form.replyMessage}
            onChange={e => setForm(f => ({ ...f, replyMessage: e.target.value }))}
            rows={2}
            placeholder="Udah aku DM ya, cek inbox kamu 📩"
            required
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Isi DM Privat</label>
          <textarea
            value={form.dmMessage}
            onChange={e => setForm(f => ({ ...f, dmMessage: e.target.value }))}
            rows={3}
            placeholder="Halo! Ini link aplikasi gratis buat cek esai beasiswamu: chat.awardee.id"
            required
            className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none"
          />
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <button
          type="submit"
          disabled={creating}
          className="bg-navy text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-navy-2 transition-colors disabled:opacity-60"
        >
          {creating ? 'Menyimpan...' : 'Tambah Rule'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-hairline overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-hairline font-semibold text-ink text-sm">Rule Aktif ({rules.length})</div>
        {rules.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Belum ada rule. Tambahkan di atas.</p>
        ) : (
          <div className="divide-y divide-hairline">
            {rules.map(rule => (
              <div key={rule.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-mono text-xs bg-off px-2 py-1 rounded font-semibold text-ink">{rule.trigger_keyword}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${rule.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {rule.active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      onClick={() => toggleActive(rule)}
                      disabled={updating === rule.id}
                      className="text-xs text-muted hover:text-ink disabled:opacity-50"
                    >
                      {rule.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={updating === rule.id}
                      className="text-xs text-muted hover:text-red-500 disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted"><span className="font-medium text-ink">Balasan publik:</span> {rule.reply_message}</p>
                <p className="text-xs text-muted mt-0.5"><span className="font-medium text-ink">DM:</span> {rule.dm_message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-hairline overflow-hidden">
        <div className="px-5 py-3 border-b border-hairline font-semibold text-ink text-sm">10 Log Terakhir</div>
        {log.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="divide-y divide-hairline">
            {log.map(row => (
              <div key={row.id} className="px-5 py-3 text-xs flex items-center justify-between gap-3">
                <div>
                  <span className="text-ink font-medium">@{row.commenter_username ?? 'unknown'}</span>
                  <span className="text-muted ml-2">{new Date(row.processed_at).toLocaleString('id-ID')}</span>
                  {row.error && <span className="text-red-600 block mt-0.5">{row.error}</span>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded-full font-bold ${row.reply_ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>Reply</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-bold ${row.dm_ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>DM</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
