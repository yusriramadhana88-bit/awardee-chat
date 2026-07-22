'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  ScholarshipApplication,
  ApplicationStage,
  ChecklistItem,
  calculateProgress,
  getDeadlineInfo,
  formatDeadline,
  generateShareToken,
  STAGE_STATUS_LABEL,
  STAGE_STATUS_COLOR,
} from '@/lib/tracker'

type StageWithItems = ApplicationStage & { checklist_items: ChecklistItem[] }

export default function TrackerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<ScholarshipApplication | null>(null)
  const [stages, setStages] = useState<StageWithItems[]>([])
  const [tier, setTier] = useState('free')
  const [loading, setLoading] = useState(true)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const [appRes, stagesRes, userRes] = await Promise.all([
      supabase
        .from('scholarship_applications')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('application_stages')
        .select('*, checklist_items:stage_checklist_items(*)')
        .eq('application_id', id)
        .order('stage_order'),
      fetch('/api/user', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(r => r.json()),
    ])

    if (!appRes.data) { router.push('/tracker'); return }

    const stagesData = (stagesRes.data || []).map(s => ({
      ...s,
      checklist_items: (s.checklist_items || []).sort(
        (a: ChecklistItem, b: ChecklistItem) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    })) as StageWithItems[]

    setApp(appRes.data)
    setStages(stagesData)
    setTier(userRes.tier || 'free')
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function toggleChecklist(stageId: string, itemId: string, current: boolean) {
    const now = current ? null : new Date().toISOString()
    await supabase
      .from('stage_checklist_items')
      .update({ is_completed: !current, completed_at: now })
      .eq('id', itemId)

    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s
      return {
        ...s,
        checklist_items: s.checklist_items.map(c =>
          c.id === itemId ? { ...c, is_completed: !current, completed_at: now } : c
        ),
      }
    }))
  }

  async function toggleStageStatus(stage: StageWithItems) {
    const nextStatus = stage.status === 'done' ? 'in_progress' : 'done'
    await supabase
      .from('application_stages')
      .update({ status: nextStatus })
      .eq('id', stage.id)

    const updated = stages.map(s =>
      s.id === stage.id ? { ...s, status: nextStatus as ApplicationStage['status'] } : s
    )
    setStages(updated)

    const newProgress = calculateProgress(updated)
    await supabase
      .from('scholarship_applications')
      .update({ overall_progress: newProgress })
      .eq('id', id)

    setApp(prev => prev ? { ...prev, overall_progress: newProgress } : prev)
  }

  async function saveNote(stageId: string, notes: string) {
    setSavingNote(stageId)
    await supabase
      .from('application_stages')
      .update({ notes })
      .eq('id', stageId)
    setSavingNote(null)
  }

  async function handleShareLink() {
    if (!app) return
    if (app.share_token) {
      const url = `${window.location.origin}/tracker/share/${app.share_token}`
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
      return
    }
    setShareLoading(true)
    const token = generateShareToken()
    await supabase
      .from('scholarship_applications')
      .update({ share_token: token })
      .eq('id', id)
    setApp(prev => prev ? { ...prev, share_token: token } : prev)
    const url = `${window.location.origin}/tracker/share/${token}`
    await navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
    setShareLoading(false)
  }

  async function handleMarkComplete() {
    await supabase
      .from('scholarship_applications')
      .update({ status: 'completed', overall_progress: 100 })
      .eq('id', id)
    router.push('/tracker')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off">
        <div className="text-muted text-sm">Memuat...</div>
      </div>
    )
  }

  if (!app) return null

  const deadline = getDeadlineInfo(app.deadline)
  const completedStages = stages.filter(s => s.status === 'done').length

  return (
    <div className="min-h-screen bg-off">
      <header className="bg-white border-b border-hairline px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/tracker" className="text-muted hover:text-ink transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" />
            </svg>
          </Link>
          <span className="font-semibold text-ink text-sm flex-1 truncate">{app.name}</span>
          <Link
            href={`/tracker/${id}/stages`}
            className="text-xs text-gold-2 hover:underline"
          >
            Edit Tahapan
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Card */}
        <div className="bg-white rounded-2xl border border-hairline p-5 mb-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="font-bold text-ink text-lg">{app.name}</h1>
              {app.description && (
                <p className="text-sm text-muted mt-0.5">{app.description}</p>
              )}
            </div>
            <span className="text-3xl font-bold text-gold-2 shrink-0 ml-3">{app.overall_progress}%</span>
          </div>

          <div className="w-full bg-off rounded-full h-3 mb-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${app.overall_progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">
              {completedStages}/{stages.length} tahapan selesai
            </span>
            <div className="flex items-center gap-2">
              {app.deadline && (
                <span className="text-muted text-xs">
                  {formatDeadline(app.deadline)}
                </span>
              )}
              {deadline && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${deadline.bgColor} ${deadline.color}`}>
                  {deadline.label}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-hairline">
            {tier === 'pro' ? (
              <button
                onClick={handleShareLink}
                disabled={shareLoading}
                className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-600 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" />
                </svg>
                {shareCopied ? 'Link disalin!' : app.share_token ? 'Salin Link' : 'Buat Share Link'}
              </button>
            ) : (
              <span className="text-xs text-muted bg-off border border-hairline px-3 py-2 rounded-lg">
                🔒 Share link (Pro)
              </span>
            )}
            <button
              onClick={handleMarkComplete}
              className="ml-auto text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
            >
              ✓ Tandai Selesai
            </button>
          </div>
        </div>

        {/* Stages */}
        {stages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-hairline p-8 text-center">
            <p className="text-muted text-sm mb-3">Belum ada tahapan. Tambahkan dulu!</p>
            <Link
              href={`/tracker/${id}/stages`}
              className="inline-block bg-navy text-white text-sm px-5 py-2.5 rounded-xl hover:bg-navy-2 transition-colors"
            >
              + Tambah Tahapan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <StageCard
                key={stage.id}
                stage={stage}
                index={idx + 1}
                isExpanded={expandedStage === stage.id}
                onToggleExpand={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                onToggleChecklist={toggleChecklist}
                onToggleStatus={toggleStageStatus}
                onSaveNote={saveNote}
                savingNote={savingNote === stage.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StageCard({
  stage,
  index,
  isExpanded,
  onToggleExpand,
  onToggleChecklist,
  onToggleStatus,
  onSaveNote,
  savingNote,
}: {
  stage: StageWithItems
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleChecklist: (stageId: string, itemId: string, current: boolean) => void
  onToggleStatus: (stage: StageWithItems) => void
  onSaveNote: (stageId: string, notes: string) => void
  savingNote: boolean
}) {
  const [notes, setNotes] = useState(stage.notes || '')
  const isDone = stage.status === 'done'
  const checkedCount = stage.checklist_items.filter(c => c.is_completed).length

  return (
    <div className={`bg-white rounded-xl border transition-all ${isDone ? 'border-green-200 bg-green-50/30' : 'border-hairline'}`}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
        onClick={onToggleExpand}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleStatus(stage) }}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isDone
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-hairline hover:border-gold'
          }`}
        >
          {isDone && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">{index}.</span>
            <span className={`text-sm font-medium ${isDone ? 'text-muted line-through' : 'text-ink'}`}>
              {stage.name}
            </span>
          </div>
          {stage.checklist_items.length > 0 && (
            <p className="text-xs text-muted mt-0.5">
              {checkedCount}/{stage.checklist_items.length} checklist
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_STATUS_COLOR[stage.status]}`}>
            {STAGE_STATUS_LABEL[stage.status]}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-hairline pt-3 space-y-3">
          {/* Checklist */}
          {stage.checklist_items.length > 0 && (
            <div className="space-y-2">
              {stage.checklist_items.map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => onToggleChecklist(stage.id, item.id, item.is_completed)}
                    className="w-4 h-4 rounded border-hairline text-gold-2 focus:ring-gold cursor-pointer"
                  />
                  <span className={`text-sm ${item.is_completed ? 'line-through text-muted' : 'text-ink'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Catatan</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tulis catatan untuk tahapan ini..."
              rows={2}
              className="w-full border border-hairline rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold resize-none bg-off"
            />
            <button
              onClick={() => onSaveNote(stage.id, notes)}
              disabled={savingNote}
              className="mt-1 text-xs text-gold-2 hover:underline disabled:text-muted"
            >
              {savingNote ? 'Menyimpan...' : 'Simpan catatan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
