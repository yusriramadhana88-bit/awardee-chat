import type { Metadata } from 'next'
import ReferralCapture from './_components/ReferralCapture'
import SiteFooter from './_components/SiteFooter'
import './globals.css'

export const metadata: Metadata = {
  title: 'AWARDEE APP — Pusat Kendali Beasiswamu | Awardee.id',
  description: 'AWARDEE APP: chat AI Den Dhana, scholarship tracker, kalender deadline, CV analyzer, IELTS tracker, dan essay workshop GALI DIRI — semua untuk pelamar beasiswa AAS, LPDP, Chevening, dan GKS.',
  openGraph: {
    title: 'AWARDEE APP — Pusat Kendali Beasiswamu | Awardee.id',
    description: 'Konsultasi AI, tracker aplikasi, kalender, CV & essay analyzer — semua untuk perjalanan beasiswamu.',
  },
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
        <SiteFooter />
      </body>
    </html>
  )
}
