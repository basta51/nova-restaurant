'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

interface GuestInfo {
  id: string
  name: string
  room: string
  mealPlan: string
  credits: {
    restaurant: number
    drinks: number
    extras: number
  }
}

type MealType = 'breakfast' | 'lunch' | 'dinner'
type CreditType = 'drinks' | 'extras'
type ResultType = 'approved' | 'refused' | null

interface ResultMsg {
  type: ResultType
  message: string
}

export default function RestaurantPage() {
  const { t } = useLanguage()
  const [cardNumber, setCardNumber] = useState('')
  const [scanning, setScanning] = useState(false)
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null)
  const [scanError, setScanError] = useState('')

  // Meal validation
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast')
  const [validating, setValidating] = useState(false)

  // Credit deduction
  const [creditType, setCreditType] = useState<CreditType>('drinks')
  const [creditAmount, setCreditAmount] = useState('')
  const [deducting, setDeducting] = useState(false)

  const [result, setResult] = useState<ResultMsg>({ type: null, message: '' })

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardNumber.trim()) return
    setScanning(true)
    setScanError('')
    setGuestInfo(null)
    setResult({ type: null, message: '' })
    try {
      const res = await fetch(`/api/cards/${cardNumber.trim()}/guest`)
      const data = await res.json()
      if (res.ok) {
        setGuestInfo(data)
      } else {
        setScanError(data.error || 'Card not found')
      }
    } catch {
      setScanError('Error scanning card')
    } finally {
      setScanning(false)
    }
  }

  const handleValidateMeal = async () => {
    if (!guestInfo) return
    setValidating(true)
    setResult({ type: null, message: '' })
    try {
      const res = await fetch('/api/restaurant/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber: cardNumber.trim(), mealType: selectedMeal }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ type: 'approved', message: t('restaurant.approved') })
        // Refresh guest info
        const refresh = await fetch(`/api/cards/${cardNumber.trim()}/guest`)
        if (refresh.ok) setGuestInfo(await refresh.json())
      } else {
        const msg =
          data.code === 'NOT_INCLUDED'
            ? t('restaurant.mealNotIncluded')
            : data.code === 'ALREADY_SERVED'
            ? t('restaurant.alreadyServed')
            : data.error || t('restaurant.refused')
        setResult({ type: 'refused', message: msg })
      }
    } catch {
      setResult({ type: 'refused', message: t('restaurant.refused') })
    } finally {
      setValidating(false)
    }
  }

  const handleDeductCredit = async () => {
    if (!guestInfo || !creditAmount) return
    setDeducting(true)
    setResult({ type: null, message: '' })
    try {
      const res = await fetch('/api/restaurant/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardNumber: cardNumber.trim(),
          type: creditType,
          amount: parseFloat(creditAmount),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ type: 'approved', message: t('restaurant.approved') })
        setCreditAmount('')
        const refresh = await fetch(`/api/cards/${cardNumber.trim()}/guest`)
        if (refresh.ok) setGuestInfo(await refresh.json())
      } else {
        const msg =
          data.code === 'INSUFFICIENT'
            ? t('restaurant.insufficientCredit')
            : data.error || t('restaurant.refused')
        setResult({ type: 'refused', message: msg })
      }
    } catch {
      setResult({ type: 'refused', message: t('restaurant.refused') })
    } finally {
      setDeducting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('restaurant.title')}</h1>

        {/* Card scanner */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-4 max-w-xl">
          <h2 className="text-lg font-semibold text-white mb-4">{t('restaurant.scanCard')}</h2>
          <form onSubmit={handleScan} className="flex gap-3">
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder={t('restaurant.cardNumber')}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={scanning}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {scanning ? '...' : t('restaurant.scan')}
            </button>
          </form>
          {scanError && (
            <p className="mt-2 text-sm text-red-400">{scanError}</p>
          )}
        </div>

        {/* Result banner */}
        {result.type && (
          <div
            className={`max-w-xl mb-4 p-4 rounded-xl border text-center text-lg font-bold ${
              result.type === 'approved'
                ? 'bg-green-900/50 border-green-700 text-green-300'
                : 'bg-red-900/50 border-red-700 text-red-300'
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Guest info */}
        {guestInfo && (
          <div className="max-w-xl space-y-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-lg font-semibold text-white mb-3">{t('restaurant.guestInfo')}</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('restaurant.guest')}</span>
                  <span className="text-white font-medium">{guestInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('restaurant.room')}</span>
                  <span className="text-white">{guestInfo.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('restaurant.mealPlan')}</span>
                  <span className="text-white">{t(`mealPlan.${guestInfo.mealPlan}`) || guestInfo.mealPlan}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(['restaurant', 'drinks', 'extras'] as const).map((type) => (
                  <div key={type} className="bg-gray-800 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 capitalize">{t(`restaurant.${type}`)}</p>
                    <p className="text-lg font-bold text-white">{guestInfo.credits[type].toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Validate meal */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-base font-semibold text-white mb-3">{t('restaurant.validate')}</h2>
              <div className="flex gap-3">
                <select
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value as MealType)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="breakfast">{t('restaurant.breakfast')}</option>
                  <option value="lunch">{t('restaurant.lunch')}</option>
                  <option value="dinner">{t('restaurant.dinner')}</option>
                </select>
                <button
                  onClick={handleValidateMeal}
                  disabled={validating}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {validating ? '...' : t('restaurant.validate')}
                </button>
              </div>
            </div>

            {/* Deduct credit */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-base font-semibold text-white mb-3">{t('restaurant.deductCredit')}</h2>
              <div className="flex gap-3">
                <select
                  value={creditType}
                  onChange={(e) => setCreditType(e.target.value as CreditType)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="drinks">{t('restaurant.drinks')}</option>
                  <option value="extras">{t('restaurant.extras')}</option>
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder={t('restaurant.amount')}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  onClick={handleDeductCredit}
                  disabled={deducting || !creditAmount}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
                >
                  {deducting ? '...' : t('restaurant.deductCredit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
