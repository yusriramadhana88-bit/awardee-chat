export interface ScholarshipApplication {
  id: string
  user_id: string
  name: string
  description: string | null
  deadline: string | null
  status: 'active' | 'completed' | 'cancelled'
  overall_progress: number
  share_token: string | null
  created_at: string
}

export interface ApplicationStage {
  id: string
  application_id: string
  name: string
  stage_order: number
  status: 'pending' | 'in_progress' | 'done'
  due_date: string | null
  notes: string | null
  created_at: string
  checklist_items?: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  stage_id: string
  text: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
}

export function calculateProgress(stages: ApplicationStage[]): number {
  if (!stages.length) return 0
  const done = stages.filter(s => s.status === 'done').length
  return Math.round((done / stages.length) * 100)
}

export function getDeadlineInfo(deadline: string | null): {
  days: number
  label: string
  color: string
  bgColor: string
} | null {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  const days = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (days < 0) return { days, label: `${Math.abs(days)} hari lewat`, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
  if (days === 0) return { days, label: 'Deadline hari ini!', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' }
  if (days <= 7) return { days, label: `${days} hari lagi`, color: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-200' }
  if (days <= 30) return { days, label: `${days} hari lagi`, color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' }
  return { days, label: `${days} hari lagi`, color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' }
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '—'
  return new Date(deadline).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36)
}

export const APP_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 999,
}

export const STAGE_STATUS_LABEL: Record<string, string> = {
  pending: 'Belum Mulai',
  in_progress: 'Sedang Berjalan',
  done: 'Selesai',
}

export const STAGE_STATUS_COLOR: Record<string, string> = {
  pending: 'text-gray-500 bg-gray-100',
  in_progress: 'text-sky-600 bg-sky-50',
  done: 'text-green-600 bg-green-50',
}
