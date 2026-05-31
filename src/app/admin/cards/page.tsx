'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface Card {
  id: string
  number: string
  type: string
  roomNumber: string
  status: 'active' | 'inactive'
}

interface QRModalProps {
  cardNumber: string
  onClose: () => void
}

function QRModal({ cardNumber, onClose }: QRModalProps) {
  const { t } = useLanguage()
  const qrUrl = `/api/qr/${cardNumber}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${cardNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="glass-card p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t('cards.qr')} — {cardNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center mb-4 bg-white rounded-lg p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR code for card ${cardNumber}`} className="w-48 h-48 object-contain" />
        </div>
        <button
          onClick={handleDownload}
          className="nova-btn-primary w-full"
        >
          {t('cards.downloadQR')}
        </button>
      </div>
    </div>
  )
}

export default function CardsPage() {
  const { t } = useLanguage()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [qrCard, setQrCard] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cards')
      .then((r) => r.json())
      .then((data) => {
        const list = data.cards || data || []
        const mapped = (Array.isArray(list) ? list : []).map((c: any) => ({
          id: c.id,
          number: c.cardNumber,
          type: c.cardType,
          roomNumber: c.room?.number || '',
          status: (c.isActive ? 'active' : 'inactive') as 'active' | 'inactive',
        }))
        setCards(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="gradient-text text-3xl font-bold mb-6">{t('cards.title')}</h1>
        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : (
            <table className="nova-table w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('cards.number')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('cards.type')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('cards.room')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('cards.status')}</th>
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3.5">{t('cards.qr')}</th>
                </tr>
              </thead>
              <tbody>
                {cards.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-3.5 text-center text-gray-500">
                      No cards found
                    </td>
                  </tr>
                ) : (
                  cards.map((card) => (
                    <tr key={card.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5 text-white font-mono">{card.number}</td>
                      <td className="px-5 py-3.5 text-gray-300">{card.type}</td>
                      <td className="px-5 py-3.5 text-gray-300">{card.roomNumber}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={
                            card.status === 'active'
                              ? 'nova-badge-green'
                              : 'nova-badge text-gray-400 bg-gray-500/10 ring-1 ring-gray-500/20'
                          }
                        >
                          {card.status === 'active' ? t('cards.active') : t('cards.inactive')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setQrCard(card.number)}
                          className="nova-btn-primary text-xs px-3 py-1.5"
                        >
                          {t('cards.qr')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {qrCard && <QRModal cardNumber={qrCard} onClose={() => setQrCard(null)} />}
      </main>
    </div>
  )
}
