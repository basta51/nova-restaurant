'use client'
import { useState, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'

interface Notification {
  guestName: string
  room: string
  creditType: string
  balance: number
}

export default function NotificationBell() {
  const { t } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {}
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-gray-700 rounded">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-h-64 overflow-y-auto">
          <div className="p-3 border-b border-gray-700 font-semibold text-sm">{t('notifications.title')}</div>
          {notifications.length === 0 ? (
            <div className="p-3 text-sm text-gray-400">{t('notifications.empty')}</div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="p-3 border-b border-gray-700 text-sm">
                <span className="text-yellow-400">&#9888;</span> {n.guestName} - {t('client.room')} {n.room}: {n.creditType} = {n.balance}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
