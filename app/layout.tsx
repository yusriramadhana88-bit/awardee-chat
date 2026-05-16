import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tanya Den Dhana — AAS Mentor AI',
  description: 'Konsultasi beasiswa Australia Awards Scholarship (AAS) bareng AI yang dilatih dari pengalaman Den Dhana, awardee & mentor AAS.',
  openGraph: {
    title: 'Tanya Den Dhana — AAS Mentor AI',
    description: 'Konsultasi beasiswa AAS, gratis, kapan saja.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 font-sans">{children}</body>
    </html>
  )
}
