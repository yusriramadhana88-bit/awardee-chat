'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Footer situs. Disembunyikan di /planner (corong pembeli database): di sana tidak boleh ada tautan ke halaman lain.
export default function SiteFooter() {
  const pathname = usePathname()
  if (pathname?.startsWith('/planner')) return null
  return (
    <footer className="border-t border-hairline bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-muted">
            © {new Date().getFullYear()} AWARDEE APP · Awardee.id · by Den Dhana
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <Link href="/about" className="hover:text-ink transition-colors">Tentang</Link>
            <Link href="/faq" className="hover:text-ink transition-colors">FAQ</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Kontak</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Syarat & Ketentuan</Link>
            <Link href="/disclaimer" className="hover:text-ink transition-colors">Disclaimer</Link>
            <Link href="/copyright" className="hover:text-ink transition-colors">Hak Cipta</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
