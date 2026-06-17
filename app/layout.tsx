import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'AWARDEE APP — Pusat Kendali Beasiswamu | Awardee.id',
  description: 'AWARDEE APP: chat AI Den Dhana, scholarship tracker, kalender deadline, CV analyzer, IELTS tracker, dan essay workshop GALI DIRI — semua untuk pelamar beasiswa AAS, LPDP, Chevening, dan GKS.',
  openGraph: {
    title: 'AWARDEE APP — Pusat Kendali Beasiswamu | Awardee.id',
    description: 'Konsultasi AI, tracker aplikasi, kalender, CV & essay analyzer — semua untuk perjalanan beasiswamu.',
  },
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} AWARDEE APP · Awardee.id · by Den Dhana
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
            <Link href="/about" className="hover:text-sky-600 transition-colors">Tentang</Link>
            <Link href="/faq" className="hover:text-sky-600 transition-colors">FAQ</Link>
            <Link href="/contact" className="hover:text-sky-600 transition-colors">Kontak</Link>
            <Link href="/privacy" className="hover:text-sky-600 transition-colors">Privasi</Link>
            <Link href="/terms" className="hover:text-sky-600 transition-colors">Syarat & Ketentuan</Link>
            <Link href="/disclaimer" className="hover:text-sky-600 transition-colors">Disclaimer</Link>
            <Link href="/copyright" className="hover:text-sky-600 transition-colors">Hak Cipta</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 font-sans flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
