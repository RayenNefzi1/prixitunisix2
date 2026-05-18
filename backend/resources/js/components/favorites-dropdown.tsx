import { Heart, ShoppingBag, Trash2, LogIn } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { favoritesApi } from '@/services/api';

type FavoriteProduct = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: { id: number; name: string } | null;
    pivot: { created_at: string };
};

export function FavoritesDropdown() {
    const page = usePage();
    const auth = page.props.auth as { user?: { id: number } } | undefined;
    const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth?.user) {
            setLoading(false);
            return;
        }
        favoritesApi.getAll()
            .then(res => setFavorites(res.data))
            .catch(() => setFavorites([]))
            .finally(() => setLoading(false));
    }, [auth?.user]);

    const removeFavorite = (productId: number) => {
        favoritesApi.remove(productId)
            .then(() => {
                setFavorites(prev => prev.filter(p => p.id !== productId));
            });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Heart className="h-5 w-5" />
                    {favorites.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {favorites.length}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Mes Favoris ({favorites.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Chargement...
                    </div>
                ) : !auth?.user ? (
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                            Connectez-vous pour voir vos favoris
                        </p>
                        <Button asChild size="sm">
                            <Link href="/login" className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                Se connecter
                            </Link>
                        </Button>
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Aucun favori
                    </div>
                ) : (
                    <>
                        {favorites.slice(0, 5).map((product) => (
                            <DropdownMenuItem key={product.id} asChild>
                                <Link href={`/products/${product.slug}`} className="flex items-start gap-3 p-3 cursor-pointer">
                                    {product.image ? (
                                        <img 
                                            src={product.image} 
                                            alt={product.name}
                                            className="h-12 w-12 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                                            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {product.name}
                                        </p>
                                        {product.category && (
                                            <p className="text-xs text-muted-foreground">
                                                {product.category.name}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeFavorite(product.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        
                        {favorites.length > 5 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link 
                                        href="/client/favorites" 
                                        className="w-full text-center text-sm text-primary"
                                    >
                                        Voir tous les favoris ({favorites.length})
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}