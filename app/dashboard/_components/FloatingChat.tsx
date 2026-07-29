'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string }

const WELCOME: Message = {
  role: 'assistant',
  content: 'Hei! 👋 Bingung mau klik menu yang mana? Cerita aja tujuan kamu (misal "aku incar LPDP, mulai dari mana?") atau tanya apa saja soal AWARDEE APP — aku bantu arahkan.',
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: newMessages, bot: 'cs' }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      } else if (data.error === 'LIMIT_REACHED') {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Batas pertanyaan harian kamu sudah habis. Upgrade paket untuk lanjut chat hari ini ya.' }])
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Koneksi bermasalah. Coba lagi.' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Koneksi bermasalah. Coba lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm h-[70vh] max-h-[520px] bg-white rounded-2xl border border-hairline shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-navy text-white px-4 py-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">D</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Bantuan Navigasi</p>
              <p className="text-[11px] text-white/70">Den Dhana AI · bingung menu? tanya di sini</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5 bg-off">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`text-sm rounded-xl px-3 py-2 max-w-[85%] ${msg.role === 'user' ? 'bg-navy text-white' : 'bg-white border border-hairline text-ink'}`}>
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-hairline rounded-xl px-3 py-2 flex gap-1">
                  <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
                  <span className="typing-dot" style={{ animationDelay: '150ms' }}></span>
                  <span className="typing-dot" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="bg-white border-t border-hairline px-3 py-2.5">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya menu mana yang cocok..."
                rows={1}
                className="flex-1 resize-none border border-hairline rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold max-h-24 overflow-y-auto"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-navy hover:bg-navy-2 disabled:bg-hairline text-white rounded-xl px-3 py-2 transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-muted mt-1.5">
              Butuh pendalaman AAS/LPDP? <Link href="/chat/aas" className="underline">Chat AAS</Link> · <Link href="/chat/lpdp" className="underline">Chat LPDP</Link>
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-navy hover:bg-navy-2 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="Bantuan navigasi AWARDEE APP"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.945 1.37-3.677 3.348-3.97z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </>
  )
}
