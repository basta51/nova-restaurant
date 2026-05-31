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
          status: r.guests?.some((g: any) => g.isActive) ? 'occupied' : 'available',
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
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('rooms.title')}</h1>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('rooms.number')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('rooms.floor')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('rooms.status')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('rooms.guest')}</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No rooms found
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{room.number}</td>
                      <td className="px-4 py-3 text-gray-300">{room.floor}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            room.status === 'occupied'
                              ? 'bg-red-900/50 text-red-300 border border-red-700'
                              : 'bg-green-900/50 text-green-300 border border-green-700'
                          }`}
                        >
                          {room.status === 'occupied' ? t('rooms.occupied') : t('rooms.available')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{room.guestName || '—'}</td>
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
