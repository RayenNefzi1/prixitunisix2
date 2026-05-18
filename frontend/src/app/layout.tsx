import type { Metadata } from 'next'
import './globals.css'
import AppWrapper from '@/components/AppWrapper'

export const metadata: Metadata = {
  title: 'PrixTunisix — Comparateur de prix en Tunisie',
  description: 'Comparez les prix sur MyTek, Tunisianet, SFax Computer et plus.',
}

export default function RootLayout({ 
  children,
}: { 
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AppWrapper>
          {children}
        </AppWrapper>
      </body>
    </html>
  )
}