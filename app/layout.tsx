import type { Metadata } from 'next'
import Link from 'next/link'
import ReferralCapture from './_components/ReferralCapture'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-off font-sans text-ink antialiased flex flex-col min-h-screen">
        <ReferralCapture />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
