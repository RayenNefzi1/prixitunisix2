import { Head, Link, usePage } from '@inertiajs/react';
import { Heart, History, Sparkles, ArrowRight, MousePointerClick, TrendingUp, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';

type RecentProduct = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: string | null;
    brand: string | null;
    best_price: number | null;
    viewed_at: string;
};

type Suggestion = {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    category: string | null;
    brand: string | null;
    best_price: number | null;
    reason: string;
};

type Stats = {
    liked_count: number;
    visited_count: number;
    total_clicks: number;
    most_viewed_brand: { id: number; name: string; image: string | null; view_count: number } | null;
    most_viewed_fournisseur: { id: number; name: string; count: number } | null;
};

type DashboardData = {
    stats: Stats;
    recent_products: RecentProduct[];
    suggestions: Suggestion[];
};

export default function ClientDashboard() {
    const page = usePage();
    const props = page.props as { stats?: Stats; recent_products?: RecentProduct[]; suggestions?: Suggestion[] };
    
    const [loading, setLoading] = useState(!props.stats);
    const [data, setData] = useState<DashboardData | null>(props.stats ? {
        stats: props.stats,
        recent_products: props.recent_products || [],
        suggestions: props.suggestions || []
    } : null);

    useEffect(() => {
        if (!props.stats) {
            api.get('/client/dashboard')
                .then(res => setData(res.data))
                .catch(err => console.error('Failed to load dashboard', err))
                .finally(() => setLoading(false));
        }
    }, []);

    if (loading) {
        return (
            <>
                <Head title="Mon Compte - PrixTunisix" />
                <div className="container mx-auto py-8">
                    <Heading variant="small" title="Mon Compte" description="Chargement..." />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </>
        );
    }

    if (!data) {
        return (
            <>
                <Head title="Erreur - PrixTunisix" />
                <div className="container mx-auto py-8">
                    <p>Erreur lors du chargement des données.</p>
                </div>
            </>
        );
    }

    const { stats, recent_products, suggestions } = data;

    return (
        <>
            <Head title="Mon Compte - PrixTunisix" />
            <div className="container mx-auto py-8">
                <Heading
                    variant="small"
                    title="Mon Compte"
                    description="Gérez votre compte et vos préférences"
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Produits Aimés
                            </CardTitle>
                            <Heart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.liked_count}</div>
                            <p className="text-xs text-muted-foreground">
                                Dans vos favoris
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Produits Visités
                            </CardTitle>
                            <History className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.visited_count}</div>
                            <p className="text-xs text-muted-foreground">
                                Historique de navigation
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Clics Totaux
                            </CardTitle>
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total_clicks}</div>
                            <p className="text-xs text-muted-foreground">
                                Liens marchands visités
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Marque Préférée
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {stats.most_viewed_brand ? (
                                <>
                                    <div className="text-2xl font-bold truncate">{stats.most_viewed_brand.name}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.most_viewed_brand.view_count} visites
                                    </p>
                                </>
                            ) : (
                                <div className="text-muted-foreground text-sm">Aucune donnée</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Fournisseur Stats */}
                {stats.most_viewed_fournisseur && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Fournisseur le Plus Visité
                                </CardTitle>
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold">{stats.most_viewed_fournisseur.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        ({stats.most_viewed_fournisseur.count} produits vus)
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Recent Products */}
                {recent_products.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Produits Récemment Visités
                            </h2>
                            <Button variant="ghost" asChild>
                                <Link href="/client/favorites">Voir tout</Link>
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {recent_products.slice(0, 5).map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className="group"
                                >
                                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="aspect-square bg-muted relative">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Heart className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-sm font-medium truncate">
                                                {product.name}
                                            </p>
                                            {product.best_price && (
                                                <p className="text-sm font-bold text-primary">
                                                    {product.best_price} TND
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Suggestions */}
                {suggestions.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                            Recommandations IA pour Vous
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Basé sur votre historique de navigation
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {suggestions.slice(0, 6).map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug}`}
                                    className="group"
                                >
                                    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="aspect-square bg-muted relative">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-2">
                                            <p className="text-sm font-medium truncate">
                                                {product.name}
                                            </p>
                                            {product.best_price && (
                                                <p className="text-sm font-bold text-primary">
                                                    {product.best_price} TND
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground truncate">
                                                {product.reason}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4" asChild>
                        <Link href="/client/favorites" className="flex items-center gap-2">
                            <Heart className="h-5 w-5" />
                            <span className="text-left">
                                <span className="font-semibold block">Mes Favoris</span>
                                <span className="text-xs text-muted-foreground">
                                    {stats.liked_count} produits aimés
                                </span>
                            </span>
                            <ArrowRight className="ml-auto h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="outline" className="h-auto py-4" asChild>
                        <Link href="/settings/profile" className="flex items-center gap-2">
                            <History className="h-5 w-5" />
                            <span className="text-left">
                                <span className="font-semibold block">Paramètres</span>
                                <span className="text-xs text-muted-foreground">
                                    Modifier mon profil
                                </span>
                            </span>
                            <ArrowRight className="ml-auto h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </>
    );
}

ClientDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Mon Compte',
            href: '/client/dashboard',
        },
    ],
};