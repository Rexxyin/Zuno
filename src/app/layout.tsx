import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toast'
import { Poppins } from 'next/font/google'
import Preloader from '@/components/Preloader'
const inter = Poppins({ weight:"400"})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://zunoplan.vercel.app'),
  title: 'Zuno - Group Plans & Events',
  description: 'Scroll real plans. Join instantly. Show up.',
  openGraph: {
    title: 'Zuno - Group Plans & Events',
    description: 'Scroll real plans. Join instantly. Show up.',
    type: 'website',
    siteName: 'Zuno',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zuno - Group Plans & Events',
    description: 'Scroll real plans. Join instantly. Show up.',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <head>
      </head>
      <body className={`${inter.className}`}>
        <Preloader/>
        <main className="min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
