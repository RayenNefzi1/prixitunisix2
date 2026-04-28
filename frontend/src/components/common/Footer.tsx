import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">PT</span>
              </div>
              <span className="text-xl font-extrabold text-white">
                Prix<span className="text-brand-400">Tunisix</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Le comparateur de prix numéro 1 en Tunisie. Trouvez les meilleures offres sur MyTek, Tunisianet, SFax Computer et plus.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs text-gray-400">Prix mis à jour en temps réel</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Catégories populaires</h3>
            <ul className="space-y-2.5">
              {['PC Portables', 'Smartphones', 'Tablettes', 'Composants PC', 'Accessoires'].map(c => (
                <li key={c}>
                  <Link href={`/search?q=${c}`} className="text-sm text-gray-400 hover:text-white transition">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marchands */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Nos marchands partenaires</h3>
            <ul className="space-y-2.5">
              {['MyTek', 'Tunisianet', 'SFax Computer', 'Zoom Informatique', 'PC Market'].map(m => (
                <li key={m}>
                  <span className="text-sm text-gray-400">{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">PrixTunisix</h3>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-sm text-gray-400 hover:text-white transition">À propos</Link></li>
              <li><Link href="/" className="text-sm text-gray-400 hover:text-white transition">Comment ça marche ?</Link></li>
              <li><Link href="/register" className="text-sm text-gray-400 hover:text-white transition">Créer un compte</Link></li>
              <li><Link href="/login" className="text-sm text-gray-400 hover:text-white transition">Alertes prix</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© 2026 PrixTunisix. Tous droits réservés.</p>
          <p className="text-xs text-gray-500">Fait avec ❤️ en Tunisie 🇹🇳</p>
        </div>
      </div>
    </footer>
  )
}
