'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { TIER_LABEL } from '@/lib/use-user'
import { BOTS, type BotId } from '@/lib/bots'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ChatUI({ bot }: { bot: BotId }) {
  const config = BOTS[bot]
  const WELCOME: Message = { role: 'assistant', content: config.welcome }
  const registerNext = encodeURIComponent(config.path)

  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ name: string; tier: string; used: number; limit: number } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [guestId, setGuestId] = useState<string | null>(null)
  const [guestUsage, setGuestUsage] = useState<{ used: number; limit: number } | null>(null)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()

  function normalizePhone(raw: string) {
    let p = raw.replace(/\s+/g, '').replace(/-/g, '')
    if (p.startsWith('08')) p = '+62' + p.slice(1)
    if (p.startsWith('8')) p = '+62' + p
    if (!p.startsWith('+')) p = '+62' + p
    return p
  }

  async function handleSavePhone(e: React.FormEvent) {
    e.preventDefault()
    setSavingPhone(true)
    setPhoneError('')

    const normalized = normalizePhone(phoneInput)
    if (normalized.length < 10) {
      setPhoneError('Nomor WhatsApp tidak valid.')
      setSavingPhone(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setSavingPhone(false)
      return
    }

    const checkRes = await fetch('/api/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalized }),
    })
    const checkData = await checkRes.json()
    if (checkData.exists) {
      setPhoneError('Nomor WhatsApp ini sudah terdaftar di akun lain.')
      setSavingPhone(false)
      return
    }

    const saveRes = await fetch('/api/save-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, phone: normalized }),
    })
    const saveData = await saveRes.json()
    if (!saveData.ok) {
      setPhoneError('Gagal menyimpan nomor. Coba lagi.')
      setSavingPhone(false)
      return
    }

    setSavingPhone(false)
    setShowPhoneModal(false)
    sendMessage()
  }

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!config.guestAllowed) {
          router.push(`/login?next=${registerNext}`)
          return
        }
        // Guest (belum login) — tetap boleh chat, tidak dipaksa daftar dulu.
        let gid = localStorage.getItem('awardee_guest_id')
        if (!gid) {
          gid = crypto.randomUUID()
          localStorage.setItem('awardee_guest_id', gid)
        }
        setGuestId(gid)
        setCheckingAuth(false)
        return
      }
      const res = await fetch('/api/user', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      setUser(data)
      setCheckingAuth(false)
    }
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    if (user && user.used >= user.limit) return
    if (guestId && guestUsage && guestUsage.used >= guestUsage.limit) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      } else if (guestId) {
        headers['X-Guest-Id'] = guestId
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: newMessages, bot }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
        if (user) setUser({ ...user, used: user.used + 1 })
        if (guestId && typeof data.guestUsed === 'number') {
          setGuestUsage({ used: data.guestUsed, limit: data.guestLimit })
        }
      } else if (data.error === 'LIMIT_REACHED') {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Batas pertanyaan harian kamu sudah habis. Upgrade paket untuk lanjut konsultasi hari ini ya.',
        }])
      } else if (data.error === 'GUEST_LIMIT_REACHED') {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Seru banget ngobrol sama kamu! Chat gratis kamu hari ini sudah habis — daftar gratis yuk biar bisa lanjut chat + progress kamu kesimpen rapi.',
        }])
        if (typeof data.guestLimit === 'number') {
          setGuestUsage({ used: data.guestUsed ?? data.guestLimit, limit: data.guestLimit })
        }
      } else if (data.error === 'PHONE_REQUIRED') {
        // Kembalikan pesan ke input supaya bisa dikirim ulang setelah verifikasi nomor
        setMessages((prev) => prev.slice(0, -1))
        setInput(text)
        setShowPhoneModal(true)
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Koneksi bermasalah. Coba lagi.' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Koneksi bermasalah. Coba lagi.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off">
        <div className="text-muted text-sm">Memuat...</div>
      </div>
    )
  }

  const guestAtLimit = guestUsage ? guestUsage.used >= guestUsage.limit : false
  const atLimit = user ? user.used >= user.limit : guestAtLimit

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-hairline px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link href="/" className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm shrink-0">{config.navIcon}</Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">{config.title}</p>
          <p className="text-xs text-green-500">Online • {config.subtitle}</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted">{user.name}</div>
              <div className="text-xs text-muted">
                {TIER_LABEL[user.tier] ?? user.tier} · {Math.max(0, user.limit - user.used)}/{user.limit} sisa
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs text-muted hover:text-ink transition-colors">Keluar</button>
          </div>
        )}
        {!user && guestId && (
          <Link href={`/register?next=${registerNext}`} className="text-xs bg-gold text-navy px-3 py-1 rounded-full font-semibold hover:bg-gold-2 transition-colors whitespace-nowrap">
            Daftar Gratis
          </Link>
        )}
      </header>

      {/* Upgrade banner jika mendekati/sudah limit */}
      {user && user.tier === 'free' && user.used >= user.limit - 2 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-amber-700">
            {atLimit ? 'Batas harian habis.' : `${user.limit - user.used} pertanyaan tersisa hari ini.`} Upgrade untuk lanjut konsultasi.
          </p>
          <Link href="/#harga" className="text-xs bg-gold text-navy px-3 py-1 rounded-full font-semibold hover:bg-gold-2 transition-colors whitespace-nowrap ml-2">
            Upgrade
          </Link>
        </div>
      )}

      {/* Info mode tamu — bukan blocking, cuma info + ajakan halus daftar */}
      {!user && guestId && config.guestAllowed && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-blue-700">
            {guestAtLimit
              ? 'Chat gratis kamu hari ini sudah habis.'
              : guestUsage
                ? `Mode tamu · ${Math.max(0, guestUsage.limit - guestUsage.used)} chat gratis tersisa hari ini.`
                : 'Mode tamu · chat gratis, tanpa perlu daftar dulu.'}
          </p>
          <Link href={`/register?next=${registerNext}`} className="text-xs bg-navy text-white px-3 py-1 rounded-full font-semibold hover:bg-navy-2 transition-colors whitespace-nowrap ml-2">
            Daftar Gratis
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-off">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">D</div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              {msg.content.split('\n').map((line, j) => (
                <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">D</div>
            <div className="chat-bubble-ai flex gap-1 py-4 px-5">
              <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
              <span className="typing-dot" style={{ animationDelay: '150ms' }}></span>
              <span className="typing-dot" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-hairline px-4 py-3">
        {atLimit ? (
          <div className="text-center py-2">
            {user ? (
              <>
                <p className="text-sm text-muted mb-3">Batas harian kamu sudah habis. Upgrade untuk lanjut.</p>
                <Link href="/#harga" className="bg-navy text-white text-sm px-6 py-2 rounded-xl hover:bg-navy-2 transition-colors">
                  Lihat Paket Upgrade
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted mb-3">Chat gratis tamu kamu hari ini sudah habis. Daftar gratis untuk lanjut chat.</p>
                <Link href={`/register?next=${registerNext}`} className="bg-navy text-white text-sm px-6 py-2 rounded-xl hover:bg-navy-2 transition-colors">
                  Daftar Gratis untuk Lanjut
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya soal beasiswamu..."
              rows={1}
              className="flex-1 resize-none border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold max-h-32 overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-navy hover:bg-navy-2 disabled:bg-hairline text-white rounded-xl px-4 py-3 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-center text-xs text-muted mt-2">AI berbasis pengalaman Den Dhana · Awardee.id</p>
      </div>

      {/* Modal verifikasi nomor WhatsApp */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="font-bold text-ink mb-1">Verifikasi nomor WhatsApp</h2>
            <p className="text-sm text-muted mb-4">
              Sebelum lanjut chat, kami perlu nomor WhatsApp aktif kamu (1 nomor = 1 akun).
            </p>
            <form onSubmit={handleSavePhone} className="space-y-3">
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                required
                placeholder="08xxxxxxxxxx"
                className="w-full border border-hairline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
              />
              {phoneError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{phoneError}</div>
              )}
              <button
                type="submit"
                disabled={savingPhone || !phoneInput.trim()}
                className="w-full bg-navy hover:bg-navy-2 disabled:bg-hairline text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                {savingPhone ? 'Menyimpan...' : 'Simpan & Lanjut Chat'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
