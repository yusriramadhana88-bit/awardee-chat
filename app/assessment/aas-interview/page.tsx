'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }

const OPENING_PROMPT =
  'Kamu ingin di-drill mock interview AAS kilat sebelum hari-H. Ceritakan singkat dulu: program studi apa, universitas mana, dan kenapa (dalam 2-3 kalimat saja).'

export default function AasInterviewAssessmentPage() {
  const [started, setStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user' as const, content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/assessment/aas-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      } else if (data.error === 'LIMIT_REACHED') {
        setLimitReached(true)
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

  function handleStart() {
    setStarted(true)
    sendMessage(OPENING_PROMPT)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
        <div className="max-w-2xl mx-auto px-4 py-14 lg:px-8">
          <Link href="/" className="text-sm text-sky-600 hover:underline">← Awardee.id</Link>

          <div className="mt-6 text-center">
            <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              GRATIS · UNTUK YANG INTERVIEW BESOK/LUSA
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
              Simulasi Mock Interview AAS — 10 Menit
            </h1>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto">
              Chatbot ini akan menanyakan 4-6 pertanyaan gaya panel GST, memberikan micro-feedback di tiap jawaban,
              lalu memberikan verdict: siap meluncur, perlu perbaikan kecil, atau perlu kerja keras malam ini.
            </p>
          </div>

          <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Bukan simulasi lengkap 45 menit — ini gut-check cepat untuk menangkap kesalahan fatal
              sebelum kamu masuk ruangan asli.
            </p>
            <button
              onClick={handleStart}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Mulai Simulasi →
            </button>
            <p className="text-xs text-gray-400">
              Jawab dengan jujur seperti kamu sedang di depan panel yang sesungguhnya — hasilnya hanya akan sebagus jawaban kamu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <Link href="/" className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shrink-0">A</Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Simulasi Mock Interview AAS</p>
          <p className="text-xs text-green-500">Online • Awardee.id</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 bg-gray-50">
        <div className="flex justify-start">
          <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">A</div>
          <div className="chat-bubble-ai">{OPENING_PROMPT}</div>
        </div>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">A</div>
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
            <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">A</div>
            <div className="chat-bubble-ai flex gap-1 py-4 px-5">
              <span className="typing-dot" style={{ animationDelay: '0ms' }}></span>
              <span className="typing-dot" style={{ animationDelay: '150ms' }}></span>
              <span className="typing-dot" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3">
        {limitReached ? (
          <div className="text-center py-2 space-y-2">
            <p className="text-sm text-gray-500">
              Sesi simulasi ini sudah mencapai batas. Kalau mau drill lebih dalam sebelum hari-H,
              chat WhatsApp/Instagram Awardee.id untuk slot mock interview kilat.
            </p>
            <Link href="/contact" className="inline-block bg-sky-600 text-white text-sm px-6 py-2 rounded-xl hover:bg-sky-700 transition-colors">
              Hubungi Awardee.id
            </Link>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Jawab di sini..."
              rows={1}
              className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 max-h-32 overflow-y-auto"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 text-white rounded-xl px-4 py-3 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        )}
        <p className="text-center text-xs text-gray-400 mt-2">Simulasi AI · Awardee.id</p>
      </div>
    </div>
  )
}
