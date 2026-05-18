import { api } from '@/lib/api'

let cachedFavorites: number[] | null = null

export const getFavoriteIds = async (): Promise<number[]> => {
  if (cachedFavorites !== null) {
    return cachedFavorites
  }
  
  try {
    const res = await api.get('/favorites')
    cachedFavorites = res.data.map((f: { id: number }) => f.id)
    return cachedFavorites
  } catch {
    return []
  }
}

export const isFavorite = async (productId: number): Promise<boolean> => {
  const ids = await getFavoriteIds()
  return ids.includes(productId)
}

export const clearFavoritesCache = () => {
  cachedFavorites = null
}

export const updateFavoritesCache = (productId: number, added: boolean) => {
  if (cachedFavorites === null) return
  
  if (added) {
    if (!cachedFavorites.includes(productId)) {
      cachedFavorites = [...cachedFavorites, productId]
    }
  } else {
    cachedFavorites = cachedFavorites.filter(id => id !== productId)
  }
}