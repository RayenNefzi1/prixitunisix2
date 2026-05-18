import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

export const favoritesApi = {
    getAll: () => api.get('/favorites'),
    
    add: (productId: number) => api.post('/favorites', { product_id: productId }),
    
    remove: (productId: number) => api.delete(`/favorites/${productId}`),
    
    toggle: (productId: number) => api.post('/favorites/toggle', { product_id: productId }),
    
    isFavorite: async (productId: number): Promise<boolean> => {
        try {
            const response = await api.get('/favorites');
            const favorites = response.data;
            return favorites.some((p: { id: number }) => p.id === productId);
        } catch {
            return false;
        }
    },
};

export default api;