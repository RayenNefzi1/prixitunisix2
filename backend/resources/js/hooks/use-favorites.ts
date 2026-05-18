import { useState, useEffect, useCallback } from 'react';
import { favoritesApi } from '@/services/api';

export interface FavoriteProduct {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: { id: number; name: string } | null;
    brand: { id: number; name: string } | null;
    pivot: { created_at: string };
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFavorites = useCallback(async () => {
        try {
            setLoading(true);
            const response = await favoritesApi.getAll();
            setFavorites(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch favorites');
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const addFavorite = useCallback(async (productId: number) => {
        try {
            await favoritesApi.add(productId);
            await fetchFavorites();
            return true;
        } catch (err) {
            return false;
        }
    }, [fetchFavorites]);

    const removeFavorite = useCallback(async (productId: number) => {
        try {
            await favoritesApi.remove(productId);
            setFavorites(prev => prev.filter(p => p.id !== productId));
            return true;
        } catch (err) {
            return false;
        }
    }, []);

    const isFavorite = useCallback((productId: number) => {
        return favorites.some(p => p.id === productId);
    }, [favorites]);

    const toggleFavorite = useCallback(async (productId: number) => {
        if (isFavorite(productId)) {
            return removeFavorite(productId);
        } else {
            return addFavorite(productId);
        }
    }, [isFavorite, addFavorite, removeFavorite]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    return {
        favorites,
        loading,
        error,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        refetch: fetchFavorites,
    };
}