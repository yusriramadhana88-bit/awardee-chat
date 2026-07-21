'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ApplicationStage, ChecklistItem } from '@/lib/tracker'

type StageWithItems = ApplicationStage & { checklist_items: ChecklistItem[] }

export default function StagesPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const [appName, setAppName] = useState('')
  const [stages, setStages] = useState<StageWithItems[]>([])
  const [newStageName, setNewStageName] = useState('')
  const [addingChecklist, setAddingChecklist] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const [appRes, stagesRes] = await Promise.all([
      supabase
        .from('scholarship_applications')
        .select('name')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .single(),
      supabase
        .from('application_stages')
        .select('*, checklist_items:stage_checklist_items(*)')
        .eq('application_id', id)
        .order('stage_order'),
    ])

    if (!appRes.data) { router.push('/tracker'); return }

    setAppName(appRes.data.name)
    setStages((stagesRes.data || []).map(s => ({
      ...s,
      checklist_items: (s.checklist_items || []).sort(
        (a: ChecklistItem, b: ChecklistItem) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    })))
    setLoading(false)
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function addStage() {
    const name = newStageName.trim()
    if (!name) return
    setSaving(true)
    const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.stage_order)) + 1 : 0

    const { data } = await supabase
      .from('application_stages')
      .insert({ application_id: id, name, stage_order: nextOrder })
      .select('*, checklist_items:stage_checklist_items(*)')
      .single()

    if (data) {
      setStages(prev => [...prev, { ...data, checklist_items: [] }])
      setNewStageName('')
    }
    setSaving(false)
  }

  async function deleteStage(stageId: string) {
    await supabase.from('application_stages').delete().eq('id', stageId)
    setStages(prev => prev.filter(s => s.id !== stageId))
  }

  async function moveStage(stageId: string, dir: 'up' | 'down') {
    const idx = stages.findIndex(s => s.id === stageId)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === stages.length - 1) return

    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const updated = [...stages]
    const a = updated[idx]
    const b = updated[swapIdx]

    const tmpOrder = a.stage_order
    updated[idx] = { ...a, stage_order: b.stage_order }
    updated[swapIdx] = { ...b, stage_order: tmpOrder }
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]

    setStages(updated)

    await Promise.all([
      supabase.from('application_stages').update({ stage_order: updated[idx].stage_order }).eq('id', updated[idx].id),
      supabase.from('application_stages').update({ stage_order: updated[swapIdx].stage_order }).eq('id', updated[swapIdx].id),
    ])
  }

  async function updateStageName(stageId: string, name: string) {
    await supabase.from('application_stages').update({ name }).eq('id', stageId)
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, name } : s))
  }

  async function addChecklistItem(stageId: string) {
    const text = (addingChecklist[stageId] || '').trim()
    if (!text) return

    const { data } = await supabase
      .from('stage_checklist_items')
      .insert({ stage_id: stageId, text })
      .select()
      .single()

    if (data) {
      setStages(prev => prev.map(s =>
        s.id === stageId
          ? { ...s, checklist_items: [...s.checklist_items, data] }
          : s
      ))
      setAddingChecklist(prev => ({ ...prev, [stageId]: '' }))
    }
  }

  async function deleteChecklistItem(stageId: string, itemId: string) {
    await supabase.from('stage_checklist_items').delete().eq('id', itemId)
    setStages(prev => prev.map(s =>
      s.id === stageId
        ? { ...s, checklist_items: s.checklist_items.filter(c => c.id !== itemId) }
        : s
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Memuat...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href={`/tracker/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900 text-sm">Edit Tahapan</span>
            <p className="text-xs text-gray-400 truncate">{appName}</p>
          </div>
          <Link
            href={`/tracker/${id}`}
            className="text-sm bg-navy text-white px-4 py-1.5 rounded-lg hover:bg-navy-2 transition-colors"
          >
            Lihat Progress →
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {isNew && (
          <div className="bg-off border border-gold rounded-xl p-4 mb-5 text-sm text-navy">
            Aplikasi berhasil dibuat! Sekarang tambahkan tahapan-tahapan beasiswamu di bawah ini.
          </div>
        )}

        {/* Add Stage Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Tambah Tahapan Baru</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newStageName}
              onChange={e => setNewStageName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStage()}
              placeholder="Contoh: Personal Statement, IELTS, Interview"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              onClick={addStage}
              disabled={saving || !newStageName.trim()}
              className="bg-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-2 disabled:bg-gray-300 transition-colors"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Stages List */}
        {stages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Belum ada tahapan. Mulai tambahkan di atas.
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, idx) => (
              <StageEditor
                key={stage.id}
                stage={stage}
                index={idx + 1}
                isFirst={idx === 0}
                isLast={idx === stages.length - 1}
                checklistInput={addingChecklist[stage.id] || ''}
                onChecklistInputChange={val => setAddingChecklist(prev => ({ ...prev, [stage.id]: val }))}
                onMove={dir => moveStage(stage.id, dir)}
                onDelete={() => deleteStage(stage.id)}
                onUpdateName={name => updateStageName(stage.id, name)}
                onAddChecklist={() => addChecklistItem(stage.id)}
                onDeleteChecklist={itemId => deleteChecklistItem(stage.id, itemId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StageEditor({
  stage,
  index,
  isFirst,
  isLast,
  checklistInput,
  onChecklistInputChange,
  onMove,
  onDelete,
  onUpdateName,
  onAddChecklist,
  onDeleteChecklist,
}: {
  stage: StageWithItems
  index: number
  isFirst: boolean
  isLast: boolean
  checklistInput: string
  onChecklistInputChange: (val: string) => void
  onMove: (dir: 'up' | 'down') => void
  onDelete: () => void
  onUpdateName: (name: string) => void
  onAddChecklist: () => void
  onDeleteChecklist: (itemId: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(stage.name)
  const [showChecklist, setShowChecklist] = useState(false)

  function saveEdit() {
    if (editName.trim() && editName !== stage.name) {
      onUpdateName(editName.trim())
    }
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Order controls */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMove('up')}
            disabled={isFirst}
            className="text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" />
            </svg>
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={isLast}
            className="text-gray-300 hover:text-gray-500 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" />
            </svg>
          </button>
        </div>

        <span className="text-xs text-gray-400 font-medium w-5 shrink-0">{index}.</span>

        {/* Name (editable) */}
        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false) }}
            className="flex-1 border border-gold rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        ) : (
          <span
            className="flex-1 text-sm font-medium text-gray-800 cursor-pointer hover:text-gold-2 transition-colors"
            onClick={() => setEditing(true)}
          >
            {stage.name}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="text-xs text-gray-400 hover:text-gold-2 transition-colors"
          >
            ☑ {stage.checklist_items.length}
          </button>
          <button
            onClick={onDelete}
            className="text-gray-300 hover:text-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Checklist Items */}
      {showChecklist && (
        <div className="px-4 pb-3 border-t border-gray-100 pt-2">
          <div className="space-y-1.5 mb-2">
            {stage.checklist_items.map(item => (
              <div key={item.id} className="flex items-center gap-2 group">
                <span className="text-gray-400 text-xs">•</span>
                <span className="flex-1 text-sm text-gray-700">{item.text}</span>
                <button
                  onClick={() => onDeleteChecklist(item.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={checklistInput}
              onChange={e => onChecklistInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAddChecklist()}
              placeholder="Tambah item checklist..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              onClick={onAddChecklist}
              disabled={!checklistInput.trim()}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              + Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
