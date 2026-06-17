'use client'

type Props = {
  label: string
  score: number | null
  maxScore: number
  percent: number        // 0-100
  levelName: string
  emoji: string
  color: string          // Tailwind text color class
  bgColor: string        // Tailwind bg color class
  borderColor: string    // Tailwind border color class
  message?: string
  barColor?: string      // Tailwind bg class for the fill bar (default: bg-sky-500)
}

export default function LevelProgressBar({
  label,
  score,
  maxScore,
  percent,
  levelName,
  emoji,
  color,
  bgColor,
  borderColor,
  message,
  barColor = 'bg-sky-500',
}: Props) {
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bgColor} ${color} border ${borderColor}`}>
            {emoji} {levelName}
          </span>
          {score !== null && (
            <span className={`text-sm font-bold ${color}`}>{score}/{maxScore}</span>
          )}
        </div>
      </div>
      <div className="h-2 bg-white/70 rounded-full overflow-hidden border border-white/50">
        <div
          className={`h-2 ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {message && (
        <p className={`text-[11px] mt-1.5 ${color} opacity-80`}>{message}</p>
      )}
    </div>
  )
}
