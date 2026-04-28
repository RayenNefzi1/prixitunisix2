import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import CategoryTabsLoader from '@/components/common/CategoryTabsLoader'
import ChatbotWidget from '@/components/common/ChatbotWidget'

export const metadata: Metadata = {
  title: 'PrixTunisix — Comparateur de prix en Tunisie',
  description: 'Comparez les prix sur MyTek, Tunisianet, SFax Computer et plus.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Navbar />
        <CategoryTabsLoader />
        <main>{children}</main>
        <Footer />
        <ChatbotWidget />
      </body>
    </html>
  )
}
