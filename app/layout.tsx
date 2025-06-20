import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Изучение Китайского — Интерактивные Карточки',
  description: 'Эффективное изучение китайского языка с помощью интерактивных карточек, системы повторений и произношения.',
  keywords: 'китайский язык, карточки, изучение языков, китайский для русских, произношение, пиньинь',
  authors: [{ name: 'Chinese Learning App' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Изучение Китайского — Интерактивные Карточки',
    description: 'Эффективное изучение китайского языка с помощью интерактивных карточек',
    type: 'website',
    locale: 'ru_RU'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className={inter.className}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
} 