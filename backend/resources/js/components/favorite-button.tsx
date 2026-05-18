import { Heart } from 'lucide-react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { favoritesApi } from '@/services/api';

interface FavoriteButtonProps {
    productId: number;
    initialFavorite?: boolean;
    className?: string;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({ productId, initialFavorite = false, className = '', size = 'icon', onToggle }: FavoriteButtonProps) {
    const page = usePage();
    const auth = page.props.auth as { user?: { id: number } } | undefined;
    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const [loading, setLoading] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!auth?.user) {
            window.location.href = '/login';
            return;
        }
        
        setLoading(true);
        
        try {
            const res = await favoritesApi.toggle(productId);
            const newState = res.data.status === 'added';
            setIsFavorite(newState);
            onToggle?.(newState);
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size={size}
            onClick={handleClick}
            disabled={loading}
            className={`${className} ${isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
        >
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </Button>
    );
}