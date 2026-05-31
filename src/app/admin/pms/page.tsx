'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useLanguage } from '@/components/LanguageProvider'

export default function PmsPage() {
  const { t } = useLanguage()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'connected' | 'disconnected'>('idle')
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/pms/webhook`)
  }, [])

  const handleTest = async () => {
    setStatus('testing')
    setTestResult('')
    try {
      const res = await fetch('/api/pms/test', { method: 'POST' })
      if (res.ok) {
        setStatus('connected')
        setTestResult(t('pms.connected'))
      } else {
        setStatus('disconnected')
        setTestResult(t('pms.disconnected'))
      }
    } catch {
      setStatus('disconnected')
      setTestResult(t('pms.disconnected'))
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">{t('pms.title')}</h1>

        <div className="max-w-2xl space-y-4">
          {/* Webhook URL card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('pms.webhook')}</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                suppressHydrationWarning
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 font-mono text-sm focus:outline-none select-all"
              />
              <button
                onClick={() => webhookUrl && navigator.clipboard.writeText(webhookUrl)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Configure this URL in your PMS to send check-in/check-out events.
            </p>
          </div>

          {/* Connection test card */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t('pms.status')}</h2>
              {status !== 'idle' && status !== 'testing' && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    status === 'connected'
                      ? 'bg-green-900/50 text-green-300 border border-green-700'
                      : 'bg-red-900/50 text-red-300 border border-red-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  {testResult}
                </span>
              )}
            </div>
            <button
              onClick={handleTest}
              disabled={status === 'testing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {status === 'testing' ? 'Testing...' : t('pms.test')}
            </button>
          </div>

          {/* Integration instructions */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Integration</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Send a <span className="text-blue-400 font-mono">POST</span> request to the webhook URL above with the following payload:</p>
              <pre className="bg-gray-800 rounded-lg p-3 text-gray-300 text-xs overflow-x-auto">{`{
  "event": "checkin" | "checkout",
  "roomNumber": "101",
  "guestName": "John Doe",
  "mealPlan": "half_board",
  "occupants": 2
}`}</pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
