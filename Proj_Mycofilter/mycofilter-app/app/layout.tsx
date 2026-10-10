import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MycoFilter 2.0 — Smart Biohybrid Water-Treatment Monitoring',
  description:
    'Real-time monitoring platform for the MycoFilter 2.0 modular biohybrid water-treatment system. Tracks sensor measurements, calibration, treatment performance and filter maintenance.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
