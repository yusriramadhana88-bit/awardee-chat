'use client'

type Verdict = 'sesuai' | 'perlu_perbaikan' | 'tidak_sesuai' | null | undefined

const CONFIG: Record<string, { emoji: string; label: string; className: string }> = {
  none: { emoji: '⬜', label: 'Belum diunggah', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  sesuai: { emoji: '🟢', label: 'Sesuai', className: 'bg-green-50 text-green-700 border-green-200' },
  perlu_perbaikan: { emoji: '🟡', label: 'Perlu Perbaikan', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  tidak_sesuai: { emoji: '🔴', label: 'Tidak Sesuai', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function DocStatusChip({ verdict }: { verdict: Verdict }) {
  const c = CONFIG[verdict ?? 'none']
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${c.className}`}>
      {c.emoji} {c.label}
    </span>
  )
}
