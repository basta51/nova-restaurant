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
      .then((data) => {
        const list = data.guests || data || []
        const mapped = (Array.isArray(list) ? list : []).map((g: any) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          roomNumber: g.room?.number || '',
          mealPlan: g.mealPlan,
          status: (g.isActive ? 'active' : 'checked_out') as 'active' | 'checked_out',
        }))
        setGuests(mapped)
      })
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
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold gradient-text mb-6">{t('guests.title')}</h1>
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('guests.name')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('guests.room')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('guests.mealPlan')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('guests.status')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('guests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-3.5 text-center text-gray-500">
                      No guests found
                    </td>
                  </tr>
                ) : (
                  guests.map((guest) => (
                    <tr key={guest.id}>
                      <td className="px-5 py-3.5 text-white">
                        {guest.firstName} {guest.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">{guest.roomNumber}</td>
                      <td className="px-5 py-3.5 text-gray-300">
                        {t(`mealPlan.${guest.mealPlan}`) || guest.mealPlan}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={
                            guest.status === 'active'
                              ? 'nova-badge-green'
                              : 'nova-badge text-gray-400 bg-gray-500/10 ring-1 ring-gray-500/20'
                          }
                        >
                          {guest.status === 'active' ? t('guests.active') : t('guests.checkedOut')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {guest.status === 'active' && (
                          <button
                            onClick={() => handleCheckout(guest.id)}
                            disabled={checkingOut === guest.id}
                            className="nova-btn-danger text-xs px-3 py-1.5"
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
