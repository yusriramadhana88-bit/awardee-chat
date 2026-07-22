'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getDeadlineInfo, formatDeadline, STAGE_STATUS_COLOR, STAGE_STATUS_LABEL } from '@/lib/tracker'

type SharedData = {
  id: string
  name: string
  description: string | null
  deadline: string | null
  overall_progress: number
  status: string
  stages: {
    id: string
    name: string
    stage_order: number
    status: string
    due_date: string | null
    notes: string | null
    checklist_items: {
      id: string
      text: string
      is_completed: boolean
    }[]
  }[]
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<SharedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: result, error } = await supabase.rpc('get_shared_application', {
        p_token: token,
      })

      if (error || !result) {
        setNotFound(true)
      } else {
        setData(result as SharedData)
      }
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off">
        <div className="text-muted text-sm">Memuat...</div>
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="font-bold text-ink mb-2">Link tidak valid</h2>
          <p className="text-sm text-muted mb-5">Progress tracker ini tidak ditemukan atau sudah kadaluarsa.</p>
          <Link href="/" className="text-gold-2 text-sm hover:underline">Kembali ke Awardee.id</Link>
        </div>
      </div>
    )
  }

  const deadline = getDeadlineInfo(data.deadline)
  const completedStages = data.stages.filter(s => s.status === 'done').length

  return (
    <div className="min-h-screen bg-off">
      <header className="bg-white border-b border-hairline px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-ink text-sm">Awardee.id</span>
          </Link>
          <span className="text-xs text-muted bg-off px-2.5 py-1 rounded-full">Read Only</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-2xl border border-hairline p-6 mb-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-ink">{data.name}</h1>
              {data.description && (
                <p className="text-sm text-muted mt-1">{data.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-4xl font-bold text-gold-2">{data.overall_progress}%</span>
              <p className="text-xs text-muted mt-0.5">progress</p>
            </div>
          </div>

          <div className="w-full bg-off rounded-full h-3 mb-4">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${data.overall_progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">{completedStages}/{data.stages.length} tahapan selesai</span>
            <div className="flex items-center gap-2">
              {data.deadline && (
                <span className="text-muted text-xs">{formatDeadline(data.deadline)}</span>
              )}
              {deadline && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${deadline.bgColor} ${deadline.color}`}>
                  {deadline.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stages */}
        <h2 className="text-sm font-semibold text-ink mb-3">Tahapan Aplikasi</h2>
        <div className="space-y-3">
          {data.stages.map((stage, idx) => {
            const isDone = stage.status === 'done'
            const checkedCount = stage.checklist_items.filter(c => c.is_completed).length

            return (
              <div
                key={stage.id}
                className={`bg-white rounded-xl border p-4 ${isDone ? 'border-green-200 bg-green-50/30' : 'border-hairline'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isDone ? 'bg-green-500 border-green-500 text-white' : 'border-hairline'
                  }`}>
                    {isDone && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" />
                      </svg>
                    )}
                  </div>
                  <span className={`font-medium text-sm flex-1 ${isDone ? 'text-muted line-through' : 'text-ink'}`}>
                    <span className="text-muted mr-1">{idx + 1}.</span>
                    {stage.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STATUS_COLOR[stage.status]}`}>
                    {STAGE_STATUS_LABEL[stage.status]}
                  </span>
                </div>

                {stage.checklist_items.length > 0 && (
                  <div className="ml-9 space-y-1.5">
                    {stage.checklist_items.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          item.is_completed ? 'bg-blue-500 border-gold' : 'border-hairline'
                        }`}>
                          {item.is_completed && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5">
                              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-xs ${item.is_completed ? 'line-through text-muted' : 'text-muted'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                    <p className="text-xs text-muted mt-1">
                      {checkedCount}/{stage.checklist_items.length} item selesai
                    </p>
                  </div>
                )}

                {stage.notes && (
                  <div className="ml-9 mt-2 text-xs text-muted bg-off rounded-lg px-3 py-2">
                    {stage.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted">
            Progress tracker ini dibuat dengan{' '}
            <Link href="/" className="text-gold-2 hover:underline">Awardee.id</Link>
            {' '}— Platform persiapan beasiswa AAS.
          </p>
          <Link href="/register" className="inline-block mt-3 text-sm bg-navy text-white px-5 py-2 rounded-xl hover:bg-navy-2 transition-colors">
            Buat Tracker Beasiswamu Sendiri →
          </Link>
        </div>
      </main>
    </div>
  )
}
