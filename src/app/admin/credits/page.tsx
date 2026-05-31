'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface GuestCredit {
  guestId: string
  guestName: string
  roomNumber: string
  restaurant: number
  drinks: number
  extras: number
}

export default function CreditsPage() {
  const { t } = useLanguage()
  const [credits, setCredits] = useState<GuestCredit[]>([])
  const [loading, setLoading] = useState(true)

  // Add credit form state
  const [selectedGuest, setSelectedGuest] = useState('')
  const [creditType, setCreditType] = useState<'restaurant' | 'drinks' | 'extras'>('restaurant')
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [addMsg, setAddMsg] = useState('')

  const loadCredits = () => {
    setLoading(true)
    fetch('/api/credits')
      .then((r) => r.json())
      .then((data) => {
        const list = data.credits || data || []
        const arr = Array.isArray(list) ? list : []
        // Aggregate credits by guest
        const map = new Map<string, GuestCredit>()
        arr.forEach((c: any) => {
          const gId = c.guest?.id || c.guestId
          if (!map.has(gId)) {
            map.set(gId, {
              guestId: gId,
              guestName: `${c.guest?.firstName || ''} ${c.guest?.lastName || ''}`.trim(),
              roomNumber: c.guest?.room?.number || '',
              restaurant: 0,
              drinks: 0,
              extras: 0,
            })
          }
          const entry = map.get(gId)!
          if (c.type === 'restaurant') entry.restaurant = c.balance || 0
          else if (c.type === 'drinks') entry.drinks = c.balance || 0
          else if (c.type === 'extras') entry.extras = c.balance || 0
        })
        setCredits(Array.from(map.values()))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCredits()
  }, [])

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGuest || !amount) return
    setAdding(true)
    setAddMsg('')
    try {
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuest,
          type: creditType,
          amount: parseFloat(amount),
        }),
      })
      if (res.ok) {
        setAddMsg('Credit added')
        setAmount('')
        loadCredits()
      } else {
        const d = await res.json()
        setAddMsg(d.error || 'Error')
      }
    } catch {
      setAddMsg('Error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('credits.title')}</h1>

        {/* Credits Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('credits.guest')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('credits.room')}</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">{t('credits.restaurant')}</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">{t('credits.drinks')}</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">{t('credits.extras')}</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">{t('credits.total')}</th>
                </tr>
              </thead>
              <tbody>
                {credits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No credits data
                    </td>
                  </tr>
                ) : (
                  credits.map((gc) => (
                    <tr key={gc.guestId} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">{gc.guestName}</td>
                      <td className="px-4 py-3 text-gray-300">{gc.roomNumber}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{gc.restaurant.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{gc.drinks.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{gc.extras.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">
                        {(gc.restaurant + gc.drinks + gc.extras).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Credit Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t('credits.addCredit')}</h2>
          {addMsg && (
            <div className="mb-4 p-3 bg-blue-900/40 border border-blue-700 rounded-lg text-blue-300 text-sm">
              {addMsg}
            </div>
          )}
          <form onSubmit={handleAddCredit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('credits.guest')}</label>
              <select
                value={selectedGuest}
                onChange={(e) => setSelectedGuest(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">—</option>
                {credits.map((gc) => (
                  <option key={gc.guestId} value={gc.guestId}>
                    {gc.guestName} ({gc.roomNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select
                value={creditType}
                onChange={(e) => setCreditType(e.target.value as 'restaurant' | 'drinks' | 'extras')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="restaurant">{t('credits.restaurant')}</option>
                <option value="drinks">{t('credits.drinks')}</option>
                <option value="extras">{t('credits.extras')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('restaurant.amount')}</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {adding ? '...' : t('credits.addCredit')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
