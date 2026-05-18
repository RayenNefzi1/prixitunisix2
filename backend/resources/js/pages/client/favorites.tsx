import { Head, router } from '@inertiajs/react';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/heading';

type FavoriteProduct = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: { id: number; name: string } | null;
    brand: { id: number; name: string } | null;
    pivot: { created_at: string };
};

type Props = {
    favorites: FavoriteProduct[];
};

export default function ClientFavorites({ favorites }: Props) {
    const removeFavorite = (productId: number) => {
        router.delete(`/api/favorites/${productId}`, {
            onSuccess: () => {
                router.reload();
            },
        });
    };

    return (
        <>
            <Head title="Mes Favoris" />
            <div className="container mx-auto py-8">
                <Heading
                    variant="small"
                    title="Mes Favoris"
                    description="Gérez vos produits favoris"
                />

                {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Aucun favori
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Ajoutez des produits à vos favoris pour les retrouver ici.
                        </p>
                        <Button asChild>
                            <a href="/products">Parcourir les produits</a>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {favorites.map((product) => (
                            <div
                                key={product.id}
                                className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="aspect-square relative bg-muted">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold truncate">
                                        {product.name}
                                    </h3>
                                    {product.category && (
                                        <p className="text-sm text-muted-foreground">
                                            {product.category.name}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                        >
                                            <a href={`/products/${product.slug}`}>
                                                Voir
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFavorite(product.id)}
                                            className="text-muted-foreground hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ClientFavorites.layout = {
    breadcrumbs: [
        {
            title: 'Mes Favoris',
            href: '/client/favorites',
        },
    ],
};