'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from '@/components/LanguageProvider'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t('auth.error'))
      } else {
        router.push('/admin')
      }
    } catch {
      setError(t('auth.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen nova-bg-animated flex items-center justify-center px-4 relative">
      <div className="nova-particles" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-2xl shadow-orange-500/30 mb-5">
            <Image src="/logo-icon.svg" alt="Nova" width={52} height={52} className="rounded-xl" />
          </div>
          <h1 className="text-4xl font-extrabold gradient-text tracking-wider">NOVA</h1>
          <p className="text-gray-400 mt-2 text-sm font-medium tracking-widest uppercase">Hotel Restaurant Control</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-6">{t('auth.login')}</h2>
          {error && (
            <div className="mb-5 p-3.5 bg-red-500/10 ring-1 ring-red-500/20 rounded-xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="nova-input"
                placeholder="admin@hotel.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="nova-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full nova-btn-primary text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading...
                </span>
              ) : t('auth.submit')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-8">
          Powered by Nova &middot; Hotel Restaurant Control
        </p>
      </div>
    </div>
  )
}
