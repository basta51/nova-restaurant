'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface ActiveGuest {
  id: string
  firstName: string
  lastName: string
  roomNumber: string
  mealPlan: string
}

interface Room {
  id: string
  number: string
}

export default function CheckinPage() {
  const { t } = useLanguage()

  // Available rooms
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([])
  const [loadingGuests, setLoadingGuests] = useState(true)

  // Form state
  const [selectedRoom, setSelectedRoom] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [occupants, setOccupants] = useState('1')
  const [mealPlan, setMealPlan] = useState('breakfast_only')
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitError, setSubmitError] = useState('')

  // Checkout state
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  const loadData = () => {
    setLoadingGuests(true)
    Promise.all([
      fetch('/api/rooms?status=available').then((r) => r.json()),
      fetch('/api/guests?status=active').then((r) => r.json()),
    ])
      .then(([roomsData, guestsData]) => {
        setRooms(Array.isArray(roomsData) ? roomsData : [])
        setActiveGuests(Array.isArray(guestsData) ? guestsData : [])
      })
      .catch(() => {})
      .finally(() => setLoadingGuests(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMsg('')
    setSubmitError('')
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom,
          firstName,
          lastName,
          occupants: parseInt(occupants, 10),
          mealPlan,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitMsg('Check-in successful')
        setFirstName('')
        setLastName('')
        setOccupants('1')
        setMealPlan('breakfast_only')
        setSelectedRoom('')
        loadData()
      } else {
        setSubmitError(data.error || 'Error')
      }
    } catch {
      setSubmitError('Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckout = async (id: string) => {
    setCheckingOut(id)
    try {
      await fetch(`/api/guests/${id}/checkout`, { method: 'POST' })
      loadData()
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
        <h1 className="text-2xl font-bold text-white mb-6">{t('checkin.title')}</h1>

        {/* Check-in Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-4">{t('checkin.newGuest')}</h2>
          {submitMsg && (
            <div className="mb-4 p-3 bg-green-900/40 border border-green-700 rounded-lg text-green-300 text-sm">
              {submitMsg}
            </div>
          )}
          {submitError && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {submitError}
            </div>
          )}
          <form onSubmit={handleCheckin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('checkin.firstName')}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('checkin.lastName')}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('checkin.room')}</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">—</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('checkin.occupants')}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={occupants}
                  onChange={(e) => setOccupants(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">{t('checkin.mealPlan')}</label>
              <select
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="breakfast_only">{t('mealPlan.breakfast_only')}</option>
                <option value="half_board">{t('mealPlan.half_board')}</option>
                <option value="full_board">{t('mealPlan.full_board')}</option>
                <option value="all_inclusive">{t('mealPlan.all_inclusive')}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? '...' : t('checkin.submit')}
            </button>
          </form>
        </div>

        {/* Active Guests */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">{t('checkin.activeGuests')}</h2>
          </div>
          {loadingGuests ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.name')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('checkin.room')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('checkin.mealPlan')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('guests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {activeGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No active guests
                    </td>
                  </tr>
                ) : (
                  activeGuests.map((guest) => (
                    <tr key={guest.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white">
                        {guest.firstName} {guest.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{guest.roomNumber}</td>
                      <td className="px-4 py-3 text-gray-300">
                        {t(`mealPlan.${guest.mealPlan}`) || guest.mealPlan}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleCheckout(guest.id)}
                          disabled={checkingOut === guest.id}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {checkingOut === guest.id ? '...' : t('checkin.checkout')}
                        </button>
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
