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
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">{t('transactions.title')}</h1>
          <div className="flex gap-2">
            <a
              href={exportUrl('csv')}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t('transactions.exportCSV')}
            </a>
            <a
              href={exportUrl('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {t('transactions.exportPDF')}
            </a>
          </div>
        </div>

        {/* Filter */}
        <form onSubmit={handleFilter} className="flex gap-3 mb-4">
          <input
            type="text"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            placeholder={t('transactions.room')}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-40"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Filter
          </button>
          {roomFilter && (
            <button
              type="button"
              onClick={() => { setRoomFilter(''); loadTransactions() }}
              className="text-gray-400 hover:text-white text-sm px-2 transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('transactions.date')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('transactions.guest')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('transactions.room')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('transactions.type')}</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">{t('transactions.amount')}</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">{t('transactions.status')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {new Date(tx.date).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-white">{tx.guestName}</td>
                      <td className="px-4 py-3 text-gray-300">{tx.roomNumber}</td>
                      <td className="px-4 py-3 text-gray-300">{tx.type}</td>
                      <td className="px-4 py-3 text-right text-white">{tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'approved'
                              ? 'bg-green-900/50 text-green-300 border border-green-700'
                              : 'bg-red-900/50 text-red-300 border border-red-700'
                          }`}
                        >
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
