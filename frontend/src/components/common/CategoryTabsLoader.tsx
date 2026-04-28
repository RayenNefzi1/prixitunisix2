'use client'

import { useState, useEffect } from 'react'
import CategoryTabs from './CategoryTabs'
import api from '@/lib/api'

interface Category {
  id: number
  code: string
  name: string
  slug: string
  children?: Category[]
}

export default function CategoryTabsLoader() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {})
  }, [])

  if (categories.length === 0) return null
  return <CategoryTabs categories={categories} />
}
