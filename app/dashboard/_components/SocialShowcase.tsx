'use client'

const SOCIALS = [
  { name: 'Instagram', handle: '@awardee.id', href: 'https://www.instagram.com/awardee.id/', icon: '📸', color: 'text-pink-600' },
  { name: 'TikTok', handle: '@awardee.id', href: 'https://www.tiktok.com/@awardee.id', icon: '🎵', color: 'text-ink' },
  { name: 'YouTube', handle: '@awardeeid', href: 'https://www.youtube.com/@awardeeid', icon: '▶️', color: 'text-red-600' },
]

const TOP_VIDEOS = [
  { id: 'XiEloZn1kto', title: 'LIVE!! DIAJARIN Interview Beasiswa Luar Negeri Bareng Dua Awardee AAS Sekaligus' },
  { id: 'B-Gqmw-yDAo', title: 'Pertanyaan Interview Beasiswa yang Sering Ditanya' },
  { id: 'm0EcnA8ZSl8', title: 'Free Webinar AAS 2025 with kak Fitria dan kak DenDhana' },
]

export default function SocialShowcase() {
  return (
    <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
      <h2 className="text-sm font-semibold text-ink mb-3">Ikuti Awardee.id</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {SOCIALS.map(s => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-off rounded-lg px-3 py-2 border border-hairline hover:border-gold transition-colors"
          >
            <span className="text-lg">{s.icon}</span>
            <div>
              <div className={`text-xs font-semibold ${s.color}`}>{s.name}</div>
              <div className="text-[11px] text-muted">{s.handle}</div>
            </div>
          </a>
        ))}
      </div>

      <h3 className="text-xs font-semibold text-muted mb-2">Top Posts</h3>
      <div className="grid grid-cols-3 gap-2">
        {TOP_VIDEOS.map(v => (
          <a
            key={v.id}
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-lg overflow-hidden border border-hairline aspect-video bg-off"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
              alt={v.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
