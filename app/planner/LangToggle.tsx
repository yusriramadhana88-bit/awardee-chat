'use client'

import { useLang } from '@/lib/study-planner/lang'

// Pilihan bahasa Indonesia / English (tersimpan di browser, dibaca seluruh halaman Study Planner).
export default function LangToggle() {
  const { lang, setLang } = useLang()
  const btn = (l: 'id' | 'en', label: string) => (
    <button type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
      className={`px-3 py-1 text-xs font-bold rounded-pill transition-colors ${lang === l ? 'bg-navy text-white' : 'text-muted hover:text-ink'}`}>{label}</button>
  )
  return <div className="inline-flex items-center border border-hairline rounded-pill p-0.5 bg-white" role="group" aria-label="Language">{btn('id', 'ID')}{btn('en', 'EN')}</div>
}
