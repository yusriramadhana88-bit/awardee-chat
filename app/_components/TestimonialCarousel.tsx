'use client'

import { useRef } from 'react'

export type Testimonial = {
  name: string | null
  program: string
  quote: string
}

// Testimoni ditranskrip dari screenshot chat WhatsApp asli (bukan file gambar — direkonstruksi
// sebagai bubble chat WA biar tampilan "screenshot" tanpa perlu upload aset foto/PII tambahan).
// Nama dikosongkan untuk testimoni yang identitasnya sengaja disamarkan pengirim aslinya.
export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Azza Firdaus',
    program: 'LPDP Tahap 2 2023',
    quote: 'Setelah sebelumnya nyoba LPDP 3 kali gagal di interview, akhirnya ikut program Awardee.id dan alhamdulillah lolos di LPDP tahap 2 2023. Terbantu sekali oleh tim Awardee.id dalam persiapan interviewku. Selain membantu menggali potensi diri, juga mendapat pelatihan intensif untuk mock interview. Banyak feedback spesifik dan bermanfaat supaya bisa menjawab lebih efektif dan direct. Terima kasih Awardee.id !!',
  },
  {
    name: 'Anggita',
    program: 'Mentoring Interview AAS',
    quote: 'Sesi hari ini tu membantu banget soalnya ngasih clear view tentang pertanyaan-pertanyaan yang possible keluar di interview. Selain itu Mas Dhana juga ngasih gambaran kira-kira jawaban seperti apa yang diexpect sama interviewer. Plus juga saya dikasih tau strength sama weakness-nya. Intinya sesi mentoring-nya sangat helpful.',
  },
  {
    name: 'Ives',
    program: 'Australia Awards Scholarship',
    quote: 'Alhamdulillah lolos AAS! Makasih banget kak untuk sesi latihan dan udah kasih poin-poin pentingnya, ngebantu banget buat persiapan wawancaranya.',
  },
  {
    name: null,
    program: 'LPDP → University of Queensland, Pharmaceutical Industry',
    quote: 'Terima kasih ya atas ilmunya yg bermanfaat pas sy kursus sm Mas Dhana tahun lalu. Sy berhasil goal di seleksi LPDP pake jurus dan saran dari Mas Dhana tahun lalu.',
  },
]

// Satu "screenshot" chat WA hasil rekonstruksi CSS — bukan foto asli.
function WaBubbleCard({ t }: { t: Testimonial }) {
  return (
    <div className="shrink-0 snap-center w-[280px] sm:w-[320px] rounded-2xl overflow-hidden border border-hairline shadow-sm bg-[#e5ddd5]">
      <div className="bg-[#075e54] px-4 py-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {t.name ? t.name[0] : '🎓'}
        </div>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{t.name ?? 'Awardee'}</div>
          <div className="text-white/70 text-[11px] truncate">{t.program}</div>
        </div>
      </div>
      <div className="p-4 min-h-[180px] flex flex-col justify-center">
        <div className="bg-white rounded-lg rounded-tl-none px-3 py-2.5 shadow-sm">
          <p className="text-[13px] text-ink leading-relaxed whitespace-pre-wrap">{t.quote}</p>
          <div className="flex items-center justify-end gap-1 mt-1.5">
            <span className="text-[10px] text-muted">21:0{t.name ? 4 : 8}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 15" className="w-3.5 h-3.5 fill-[#53bdeb]">
              <path d="M15.01 3.316l-.478-.372a.365.365 0 00-.51.063L8.666 9.879a.32.32 0 01-.484.033l-.358-.325a.319.319 0 00-.484.032l-.378.483a.418.418 0 00.036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 00-.064-.512zm-4.1 0l-.478-.372a.365.365 0 00-.51.063L4.566 9.879a.32.32 0 01-.484.033L1.891 7.769a.366.366 0 00-.515.006l-.423.433a.364.364 0 00.006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 00-.063-.512z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestimonialCarousel({ title = 'Yang sudah membuktikan hasilnya' }: { title?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollBy(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight">{title}</h2>
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Sebelumnya"
            className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-gold transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => scrollBy(1)}
            aria-label="Berikutnya"
            className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-gold transition-colors"
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollbarWidth: 'thin' }}
      >
        {TESTIMONIALS.map((t, i) => (
          <WaBubbleCard key={i} t={t} />
        ))}
      </div>
    </div>
  )
}
