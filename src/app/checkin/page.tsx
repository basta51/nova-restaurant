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
      fetch('/api/rooms').then((r) => r.json()),
      fetch('/api/guests').then((r) => r.json()),
    ])
      .then(([roomsData, guestsData]) => {
        const roomsList = roomsData.rooms || roomsData || []
        const available = (Array.isArray(roomsList) ? roomsList : []).filter(
          (r: any) => !r.guests || r.guests.length === 0
        )
        setRooms(available)
        const guestsList = guestsData.guests || guestsData || []
        const mapped = (Array.isArray(guestsList) ? guestsList : []).map((g: any) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          roomNumber: g.room?.number || '',
          mealPlan: g.mealPlan,
        }))
        setActiveGuests(mapped)
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
      const res = await fetch('/api/guests', {
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
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="gradient-text text-3xl font-bold mb-1">{t('checkin.title')}</h1>
          <p className="text-gray-500 text-sm">Manage guest arrivals and departures</p>
        </div>

        {/* Check-in Form */}
        <div className="glass-card p-6 mb-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-4">{t('checkin.newGuest')}</h2>
          {submitMsg && (
            <div className="mb-4 p-3 bg-emerald-500/10 ring-1 ring-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              {submitMsg}
            </div>
          )}
          {submitError && (
            <div className="mb-4 p-3 bg-red-500/10 ring-1 ring-red-500/20 rounded-xl text-red-400 text-sm">
              {submitError}
            </div>
          )}
          <form onSubmit={handleCheckin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('checkin.firstName')}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="nova-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('checkin.lastName')}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="nova-input w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('checkin.room')}</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  required
                  className="nova-input w-full"
                >
                  <option value="">—</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{t('checkin.occupants')}</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={occupants}
                  onChange={(e) => setOccupants(e.target.value)}
                  required
                  className="nova-input w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t('checkin.mealPlan')}</label>
              <select
                value={mealPlan}
                onChange={(e) => setMealPlan(e.target.value)}
                className="nova-input w-full"
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
              className="nova-btn-primary w-full"
            >
              {submitting ? '...' : t('checkin.submit')}
            </button>
          </form>
        </div>

        {/* Active Guests */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Currently Staying</p>
            <h2 className="text-lg font-semibold text-white">{t('checkin.activeGuests')}</h2>
          </div>
          {loadingGuests ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('guests.name')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('checkin.room')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('checkin.mealPlan')}</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('guests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {activeGuests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No active guests
                    </td>
                  </tr>
                ) : (
                  activeGuests.map((guest) => (
                    <tr key={guest.id}>
                      <td className="px-6 py-3 text-white font-medium">
                        {guest.firstName} {guest.lastName}
                      </td>
                      <td className="px-6 py-3 text-gray-300">{guest.roomNumber}</td>
                      <td className="px-6 py-3 text-gray-300">
                        {t(`mealPlan.${guest.mealPlan}`) || guest.mealPlan}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleCheckout(guest.id)}
                          disabled={checkingOut === guest.id}
                          className="nova-btn-danger text-xs px-3 py-1.5"
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
