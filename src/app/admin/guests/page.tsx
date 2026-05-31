'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface Guest {
  id: string
  firstName: string
  lastName: string
  roomNumber: string
  mealPlan: string
  status: 'active' | 'checked_out'
}

export default function GuestsPage() {
  const { t } = useLanguage()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const loadGuests = () => {
    setLoading(true)
    fetch('/api/guests')
      .then((r) => r.json())
      .then((data) => setGuests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGuests()
  }, [])

  const handleCheckout = async (id: string) => {
    setCheckingOut(id)
    try {
      await fetch(`/api/guests/${id}/checkout`, { method: 'POST' })
      loadGuests()
    } catch {
      /* ignore */
    } finally {
      setCheckingOut(null)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('guests.title')}</h1>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.name')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.room')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.mealPlan')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.status')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No guests found
                    </td>
                  </tr>
                ) : (
                  guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">
                        {guest.firstName} {guest.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{guest.roomNumber}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {t(`mealPlan.${guest.mealPlan}`) || guest.mealPlan}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            guest.status === 'active'
                              ? 'bg-green-900/50 text-green-300 border border-green-700'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {guest.status === 'active' ? t('guests.active') : t('guests.checkedOut')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {guest.status === 'active' && (
                          <button
                            onClick={() => handleCheckout(guest.id)}
                            disabled={checkingOut === guest.id}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {checkingOut === guest.id ? '...' : t('checkin.checkout')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
