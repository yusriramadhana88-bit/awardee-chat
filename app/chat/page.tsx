'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; content: string }

const LIMITS: Record<string, number> = { free: 10, starter: 50, pro: 999 }

const WELCOME: Message = {
  role: 'assistant',
  content: 'Hei! Aku Den Dhana 👋\n\nAku awardee AAS dan founder Awardee.id. Sudah 7+ tahun aku bantu orang-orang seperti kamu lolos beasiswa ke Australia, alhamdulillah 100% mentee berbayar berhasil.\n\nKamu lagi di tahap mana dalam proses aplikasi AAS? Atau masih baru mau mulai riset?',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ name: string; tier: string; used: number; limit: number } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
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
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return
    if (user && user.used >= user.limit) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
        if (user) setUser({ ...user, used: user.used + 1 })
      } else if (data.error === 'LIMIT_REACHED') {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: 'Batas pertanyaan harian kamu sudah habis. Upgrade ke Starter atau Pro untuk lanjut konsultasi hari ini ya.',
        }])
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memuat...</div>
      </div>
    )
  }

  const atLimit = user ? user.used >= user.limit : false

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link href="/" className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">A</Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Den Dhana AI</p>
          <p className="text-xs text-green-500">Online • AAS Mentor</p>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500">{user.name}</div>
              <div className="text-xs text-gray-400">
                {user.tier === 'free' ? 'Gratis' : user.tier === 'starter' ? 'Starter' : 'Pro'} · {Math.max(0, user.limit - user.used)}/{user.limit} sisa
              </div>
            </div>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Keluar</button>
          </div>
        )}
      </header>

      {/* Upgrade banner jika mendekati/sudah limit */}
      {user && user.tier === 'free' && user.used >= user.limit - 2 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <p className="text-xs text-amber-700">
            {atLimit ? 'Batas harian habis.' : `${user.limit - user.used} pertanyaan tersisa hari ini.`} Upgrade untuk lanjut konsultasi.
          </p>
          <Link href="/#harga" className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-medium hover:bg-amber-600 transition-colors whitespace-nowrap ml-2">
            Upgrade
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">D</div>
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
            <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">D</div>
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
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        {atLimit ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 mb-3">Batas harian kamu sudah habis. Upgrade untuk lanjut.</p>
            <Link href="/#harga" className="bg-sky-600 text-white text-sm px-6 py-2 rounded-xl hover:bg-sky-700 transition-colors">
              Lihat Paket Upgrade
            </Link>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya soal AAS..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-h-32 overflow-y-auto"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-xl px-4 py-3 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-2">AI berbasis pengalaman Den Dhana · Awardee.id</p>
      </div>
    </div>
  )
}
