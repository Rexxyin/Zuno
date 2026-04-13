import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Zuno',
  description: 'Scroll real plans. Join instantly. Show up.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
