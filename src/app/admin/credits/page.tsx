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
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold gradient-text mb-6">{t('credits.title')}</h1>

        {/* Credits Table */}
        <div className="glass-card overflow-hidden mb-6">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('credits.guest')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('credits.room')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 text-right">{t('credits.restaurant')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 text-right">{t('credits.drinks')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 text-right">{t('credits.extras')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 text-right">{t('credits.total')}</th>
                </tr>
              </thead>
              <tbody>
                {credits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-3.5 text-center text-gray-500">
                      No credits data
                    </td>
                  </tr>
                ) : (
                  credits.map((gc) => (
                    <tr key={gc.guestId}>
                      <td className="px-5 py-3.5 text-white">{gc.guestName}</td>
                      <td className="px-5 py-3.5 text-gray-300">{gc.roomNumber}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{gc.restaurant.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{gc.drinks.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-gray-300">{gc.extras.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right text-white font-semibold">
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
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">{t('credits.addCredit')}</h2>
          {addMsg && (
            <div className="mb-4 bg-indigo-500/10 ring-1 ring-indigo-500/20 rounded-xl text-indigo-400 text-sm p-3.5">
              {addMsg}
            </div>
          )}
          <form onSubmit={handleAddCredit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('credits.guest')}</label>
              <select
                value={selectedGuest}
                onChange={(e) => setSelectedGuest(e.target.value)}
                required
                className="nova-input"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={creditType}
                onChange={(e) => setCreditType(e.target.value as 'restaurant' | 'drinks' | 'extras')}
                className="nova-input"
              >
                <option value="restaurant">{t('credits.restaurant')}</option>
                <option value="drinks">{t('credits.drinks')}</option>
                <option value="extras">{t('credits.extras')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('restaurant.amount')}</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="nova-input"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="nova-btn-primary w-full"
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
