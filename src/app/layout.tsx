import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KeuanganKu — Kontrol Keuangan Usaha',
  description: 'Aplikasi pencatatan keuangan usaha, multi-perusahaan.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
