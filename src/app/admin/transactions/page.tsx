'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface Transaction {
  id: string
  date: string
  guestName: string
  roomNumber: string
  type: string
  amount: number
  status: string
}

export default function TransactionsPage() {
  const { t } = useLanguage()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [roomFilter, setRoomFilter] = useState('')

  const loadTransactions = (room?: string) => {
    setLoading(true)
    const url = room ? `/api/transactions?roomId=${encodeURIComponent(room)}` : '/api/transactions'
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = data.transactions || data || []
        const mapped = (Array.isArray(list) ? list : []).map((tx: any) => ({
          id: tx.id,
          date: tx.createdAt,
          guestName: `${tx.guest?.firstName || ''} ${tx.guest?.lastName || ''}`.trim(),
          roomNumber: tx.guest?.room?.number || '',
          type: tx.type,
          amount: tx.amount || 0,
          status: tx.status,
        }))
        setTransactions(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    loadTransactions(roomFilter || undefined)
  }

  const exportUrl = (format: 'csv' | 'pdf') => {
    const params = roomFilter ? `?room=${encodeURIComponent(roomFilter)}&format=${format}` : `?format=${format}`
    return `/api/export/transactions${params}`
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl font-bold gradient-text">{t('transactions.title')}</h1>
          <div className="flex gap-2">
            <a
              href={exportUrl('csv')}
              className="inline-flex items-center gap-2 font-semibold text-sm text-white py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              {t('transactions.exportCSV')}
            </a>
            <a
              href={exportUrl('pdf')}
              className="nova-btn-danger text-sm"
            >
              {t('transactions.exportPDF')}
            </a>
          </div>
        </div>

        {/* Filter */}
        <form onSubmit={handleFilter} className="flex gap-3 mb-6">
          <input
            type="text"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            placeholder={t('transactions.room')}
            className="nova-input w-40"
          />
          <button type="submit" className="nova-btn-primary text-sm">
            Filter
          </button>
          {roomFilter && (
            <button
              type="button"
              onClick={() => { setRoomFilter(''); loadTransactions() }}
              className="text-gray-400 hover:text-white text-sm px-3 transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('transactions.date')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('transactions.guest')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('transactions.room')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('transactions.type')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5 text-right">{t('transactions.amount')}</th>
                  <th className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('transactions.status')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">
                        {new Date(tx.date).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-white">{tx.guestName}</td>
                      <td className="px-5 py-3.5 text-gray-300">{tx.roomNumber}</td>
                      <td className="px-5 py-3.5 text-gray-300">{tx.type}</td>
                      <td className="px-5 py-3.5 text-right text-white font-medium">{tx.amount.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={tx.status === 'approved' ? 'nova-badge-green' : 'nova-badge-red'}>
                          {tx.status}
                        </span>
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
