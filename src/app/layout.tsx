import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/components/LanguageProvider'

export const metadata: Metadata = {
  title: 'Nova - Hotel Restaurant Control',
  description: 'Hotel restaurant management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-gray-950 text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
