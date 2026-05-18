'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <html lang="fr">
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          {children}
        </body>
      </html>
    )
  }

  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) {
    return (
      <html lang="fr">
        <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}