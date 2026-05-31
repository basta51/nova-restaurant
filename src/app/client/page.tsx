'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Inline translations — no LanguageProvider import, this is a standalone public page
type Lang = 'fr' | 'en' | 'es'

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  fr: {
    welcome: 'Bienvenue',
    room: 'Chambre',
    mealPlan: 'Formule',
    credits: 'Vos Credits',
    history: 'Historique',
    noCard: 'Carte non trouvee',
    poweredBy: 'Propulse par Nova',
    loading: 'Chargement...',
    restaurant: 'Restaurant',
    drinks: 'Boissons',
    extras: 'Extras',
    date: 'Date',
    type: 'Type',
    amount: 'Montant',
    status: 'Statut',
    breakfast_only: 'Petit-dejeuner',
    half_board: 'Demi-pension',
    full_board: 'Pension complete',
    all_inclusive: 'Tout inclus',
  },
  en: {
    welcome: 'Welcome',
    room: 'Room',
    mealPlan: 'Meal plan',
    credits: 'Your Credits',
    history: 'History',
    noCard: 'Card not found',
    poweredBy: 'Powered by Nova',
    loading: 'Loading...',
    restaurant: 'Restaurant',
    drinks: 'Drinks',
    extras: 'Extras',
    date: 'Date',
    type: 'Type',
    amount: 'Amount',
    status: 'Status',
    breakfast_only: 'Breakfast only',
    half_board: 'Half board',
    full_board: 'Full board',
    all_inclusive: 'All inclusive',
  },
  es: {
    welcome: 'Bienvenido',
    room: 'Habitacion',
    mealPlan: 'Plan de comidas',
    credits: 'Sus Creditos',
    history: 'Historial',
    noCard: 'Tarjeta no encontrada',
    poweredBy: 'Impulsado por Nova',
    loading: 'Cargando...',
    restaurant: 'Restaurante',
    drinks: 'Bebidas',
    extras: 'Extras',
    date: 'Fecha',
    type: 'Tipo',
    amount: 'Monto',
    status: 'Estado',
    breakfast_only: 'Solo desayuno',
    half_board: 'Media pension',
    full_board: 'Pension completa',
    all_inclusive: 'Todo incluido',
  },
}

interface GuestData {
  name: string
  room: string
  mealPlan: string
  credits: {
    restaurant: number
    drinks: number
    extras: number
  }
  transactions: Array<{
    id: string
    date: string
    type: string
    amount: number
    status: string
  }>
}

function ClientPageInner() {
  const searchParams = useSearchParams()
  const cardParam = searchParams.get('card') || ''

  const [lang, setLang] = useState<Lang>('fr')
  const [guestData, setGuestData] = useState<GuestData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = (key: string) => TRANSLATIONS[lang][key] || key

  useEffect(() => {
    // Try reading saved language preference
    try {
      const saved = localStorage.getItem('nova_locale') as Lang
      if (saved && ['fr', 'en', 'es'].includes(saved)) setLang(saved)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (!cardParam) return
    setLoading(true)
    setError('')
    fetch(`/api/client/${cardParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(t('noCard'))
        } else {
          setGuestData(data)
        }
      })
      .catch(() => setError(t('noCard')))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardParam])

  const handleLangChange = (l: Lang) => {
    setLang(l)
    try { localStorage.setItem('nova_locale', l) } catch { /* ignore */ }
  }

  const creditCards = [
    { key: 'restaurant', label: t('restaurant'), color: 'from-blue-700 to-blue-900', value: guestData?.credits.restaurant ?? 0 },
    { key: 'drinks', label: t('drinks'), color: 'from-purple-700 to-purple-900', value: guestData?.credits.drinks ?? 0 },
    { key: 'extras', label: t('extras'), color: 'from-gray-700 to-gray-900', value: guestData?.credits.extras ?? 0 },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-white">Nova</h1>
          <p className="text-xs text-gray-400">Hotel Restaurant Control</p>
        </div>
        {/* Language switcher */}
        <div className="flex gap-1">
          {(['fr', 'en', 'es'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              className={`px-2 py-1 rounded text-xs font-medium uppercase transition-colors ${
                lang === l
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {loading && (
          <div className="text-center py-16 text-gray-400">{t('loading')}</div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <div className="bg-red-900/40 border border-red-700 rounded-xl p-6 text-red-300">
              {error}
            </div>
          </div>
        )}

        {!loading && !error && !guestData && !cardParam && (
          <div className="text-center py-16 text-gray-500 text-sm">
            No card number provided in URL.
          </div>
        )}

        {!loading && guestData && (
          <div className="space-y-6">
            {/* Guest info */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-gray-400 text-sm">{t('welcome')}</p>
              <p className="text-2xl font-bold text-white mt-1">{guestData.name}</p>
              <div className="flex gap-6 mt-3">
                <div>
                  <p className="text-xs text-gray-500">{t('room')}</p>
                  <p className="text-white font-semibold">{guestData.room}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('mealPlan')}</p>
                  <p className="text-white font-semibold">
                    {t(guestData.mealPlan) || guestData.mealPlan}
                  </p>
                </div>
              </div>
            </div>

            {/* Credit cards */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('credits')}</h2>
              <div className="grid grid-cols-1 gap-3">
                {creditCards.map((card) => (
                  <div
                    key={card.key}
                    className={`bg-gradient-to-r ${card.color} rounded-xl p-4 flex items-center justify-between border border-white/10`}
                  >
                    <p className="text-white font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-white">{card.value.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('history')}</h2>
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {guestData.transactions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">—</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">{t('date')}</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">{t('type')}</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">{t('amount')}</th>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestData.transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-800">
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 text-gray-300">{tx.type}</td>
                          <td className="px-3 py-2 text-right text-white">{tx.amount.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                                tx.status === 'approved'
                                  ? 'bg-green-900/50 text-green-300'
                                  : 'bg-red-900/50 text-red-300'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-600 border-t border-gray-800">
        {t('poweredBy')}
      </footer>
    </div>
  )
}

export default function ClientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    }>
      <ClientPageInner />
    </Suspense>
  )
}
