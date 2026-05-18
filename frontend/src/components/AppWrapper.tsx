'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, ReactNode } from 'react'
import Navbar from '@/components/common/Navbar'
import Footer from '@/components/common/Footer'
import CategoryTabsLoader from '@/components/common/CategoryTabsLoader'
import ChatbotWidget from '@/components/common/ChatbotWidget'

export default function AppWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <CategoryTabsLoader />
      <main>{children}</main>
      <Footer />
      <ChatbotWidget />
    </>
  )
}