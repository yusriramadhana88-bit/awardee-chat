'use client'

type Cell = string | boolean

type Row = { label: string; free: Cell; starter: Cell; vip: Cell; vvip: Cell }

const ROWS: Row[] = [
  { label: 'Chat AI per hari', free: '5x', starter: '20x', vip: '50x', vvip: 'Unlimited' },
  { label: 'LPDP Center (Cek Dokumen & Review Esai)', free: '1x cicip', starter: true, vip: true, vvip: true },
  { label: 'AAS Center — Review Esai', free: '1x cicip', starter: true, vip: true, vvip: true },
  { label: 'AAS Center — Cek Dokumen', free: false, starter: true, vip: true, vvip: true },
  { label: 'Learning Modules', free: 'Silabus saja', starter: 'Akses penuh', vip: 'Akses penuh', vvip: 'Akses penuh' },
  { label: 'Scholarship Tracker', free: false, starter: true, vip: true, vvip: true },
  { label: 'Checklist Dokumen', free: false, starter: true, vip: true, vvip: true },
  { label: 'Achievements', free: false, starter: true, vip: true, vvip: true },
  { label: 'Kalender Beasiswa', free: false, starter: false, vip: true, vvip: true },
  { label: 'IELTS Tracker', free: false, starter: false, vip: true, vvip: true },
  { label: 'CV Analyzer', free: false, starter: false, vip: '3x/bulan', vvip: 'Unlimited' },
  { label: 'Essay Workshop + kritik AI GALI DIRI', free: false, starter: false, vip: false, vvip: true },
]

function Mark({ v }: { v: Cell }) {
  if (v === true) return <span className="text-green-600 font-bold">✓</span>
  if (v === false) return <span className="text-hairline">—</span>
  return <span className="text-ink font-medium">{v}</span>
}

export default function TierComparisonTable() {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr className="text-left">
            <th className="py-2 pr-3 text-white/70 font-medium text-xs">Fitur</th>
            <th className="py-2 px-3 text-center text-white/70 font-medium text-xs">Free</th>
            <th className="py-2 px-3 text-center text-amber-300 font-semibold text-xs">Starter</th>
            <th className="py-2 px-3 text-center text-gold font-semibold text-xs">VIP</th>
            <th className="py-2 px-3 text-center text-purple-300 font-semibold text-xs">VVIP</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label} className="border-t border-white/10">
              <td className="py-2.5 pr-3 text-white/90 text-xs sm:text-sm">{r.label}</td>
              <td className="py-2.5 px-3 text-center text-xs sm:text-sm"><Mark v={r.free} /></td>
              <td className="py-2.5 px-3 text-center text-xs sm:text-sm"><Mark v={r.starter} /></td>
              <td className="py-2.5 px-3 text-center text-xs sm:text-sm"><Mark v={r.vip} /></td>
              <td className="py-2.5 px-3 text-center text-xs sm:text-sm"><Mark v={r.vvip} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
