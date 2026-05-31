'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface Room {
  id: string
  number: string
  floor: number
  status: 'occupied' | 'available'
  guestName?: string
}

export default function RoomsPage() {
  const { t } = useLanguage()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rooms')
      .then((r) => r.json())
      .then((data) => {
        const list = data.rooms || data || []
        const mapped = (Array.isArray(list) ? list : []).map((r: any) => ({
          id: r.id,
          number: r.number,
          floor: r.floor,
          status: (r.guests?.some((g: any) => g.isActive) ? 'occupied' : 'available') as 'occupied' | 'available',
          guestName: r.guests?.find((g: any) => g.isActive)
            ? `${r.guests.find((g: any) => g.isActive).firstName} ${r.guests.find((g: any) => g.isActive).lastName}`
            : undefined,
        }))
        setRooms(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold gradient-text">{t('rooms.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage and monitor all hotel rooms</p>
        </div>
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="glass-card p-8 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4 mb-4" />
              <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
              <div className="h-4 bg-white/10 rounded w-1/3" />
            </div>
          ) : (
            <table className="nova-table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('rooms.number')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('rooms.floor')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('rooms.status')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('rooms.guest')}</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-3.5 text-center text-gray-500">
                      No rooms found
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-white font-medium">{room.number}</td>
                      <td className="px-5 py-3.5 text-gray-300">{room.floor}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={
                            room.status === 'occupied'
                              ? 'nova-badge-red'
                              : 'nova-badge-green'
                          }
                        >
                          {room.status === 'occupied' ? t('rooms.occupied') : t('rooms.available')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-300">{room.guestName || '—'}</td>
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
