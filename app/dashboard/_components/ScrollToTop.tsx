'use client'

import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // globals.css set html,body { overflow-x: hidden }, yang membuat browser otomatis
    // menjadikan overflow-y body "auto" — jadi body sendiri yang scroll, bukan window.
    function onScroll() {
      setVisible(document.body.scrollTop > 400)
    }
    document.body.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => document.body.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => document.body.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full bg-white border border-hairline shadow-lg flex items-center justify-center text-muted hover:text-ink hover:bg-off transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </button>
  )
}
