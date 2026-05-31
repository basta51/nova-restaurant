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
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold gradient-text mb-8">{t('pms.title')}</h1>

        <div className="max-w-2xl space-y-5">
          {/* Webhook URL card */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('pms.webhook')}</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                suppressHydrationWarning
                className="nova-input flex-1 font-mono text-sm text-gray-300"
              />
              <button
                onClick={() => webhookUrl && navigator.clipboard.writeText(webhookUrl)}
                className="nova-btn-primary text-sm whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Configure this URL in your PMS to send check-in/check-out events.
            </p>
          </div>

          {/* Connection test card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t('pms.status')}</h2>
              {status !== 'idle' && status !== 'testing' && (
                <span
                  className={`inline-flex items-center gap-2 ${
                    status === 'connected' ? 'nova-badge-green' : 'nova-badge-red'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === 'connected' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-red-400'
                    }`}
                  />
                  {testResult}
                </span>
              )}
            </div>
            <button
              onClick={handleTest}
              disabled={status === 'testing'}
              className="nova-btn-primary"
            >
              {status === 'testing' ? 'Testing...' : t('pms.test')}
            </button>
          </div>

          {/* Integration instructions */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Integration</h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Send a <span className="text-orange-400 font-mono font-medium">POST</span> request to the webhook URL above with the following payload:</p>
              <pre className="bg-white/[0.03] ring-1 ring-white/[0.06] rounded-xl p-4 text-gray-300 text-xs overflow-x-auto">{`{
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
