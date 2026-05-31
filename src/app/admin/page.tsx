'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface DashboardStats {
  activeGuests: number
  todayMeals: number
  totalCredits: number
  totalRooms: number
}

const STAT_CONFIG = [
  {
    key: 'activeGuests',
    labelKey: 'dashboard.activeGuests',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
  },
  {
    key: 'todayMeals',
    labelKey: 'dashboard.todayMeals',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    gradient: 'from-emerald-500 to-green-400',
    shadow: 'shadow-emerald-500/20',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
  },
  {
    key: 'totalCredits',
    labelKey: 'dashboard.totalCredits',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    gradient: 'from-amber-500 to-yellow-400',
    shadow: 'shadow-amber-500/20',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
  },
  {
    key: 'totalRooms',
    labelKey: 'dashboard.totalRooms',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    gradient: 'from-purple-500 to-violet-400',
    shadow: 'shadow-purple-500/20',
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/20',
  },
]

export default function AdminDashboard() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats>({
    activeGuests: 0,
    todayMeals: 0,
    totalCredits: 0,
    totalRooms: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">Vue d&apos;ensemble de votre hotel</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-800" />
                  <div className="space-y-2 flex-1">
                    <div className="w-20 h-3 bg-gray-800 rounded" />
                    <div className="w-12 h-6 bg-gray-800 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STAT_CONFIG.map((cfg) => (
              <div key={cfg.key} className="glass-card glow-card p-6 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{t(cfg.labelKey)}</p>
                    <p className="text-3xl font-bold text-white mt-0.5">
                      {stats[cfg.key as keyof DashboardStats]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Statut du systeme</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Serveur</span>
                <span className="nova-badge-green">En ligne</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Base de donnees</span>
                <span className="nova-badge-green">Connectee</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Version</span>
                <span className="text-gray-400 text-sm font-mono">v1.0.0</span>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href="/checkin" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06] text-sm text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Check-in
              </a>
              <a href="/restaurant" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06] text-sm text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Restaurant
              </a>
              <a href="/admin/rooms" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06] text-sm text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
                Chambres
              </a>
              <a href="/admin/transactions" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] ring-1 ring-white/[0.06] text-sm text-gray-300 hover:text-white transition-all">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Historique
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
