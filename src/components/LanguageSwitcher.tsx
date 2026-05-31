'use client'
import { useState, useRef, useEffect } from 'react'
import { useLanguage } from './LanguageProvider'
import { Locale } from '@/lib/i18n'

const FLAGS: Record<Locale, string> = { fr: 'FR', en: 'EN', es: 'ES' }

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="px-3 py-1.5 bg-gray-700 rounded text-sm hover:bg-gray-600">
        {FLAGS[locale]}
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 bg-gray-700 rounded shadow-lg overflow-hidden">
          {(Object.keys(FLAGS) as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false) }}
              className={`block w-full px-4 py-2 text-sm hover:bg-gray-600 ${l === locale ? 'bg-gray-600' : ''}`}
            >
              {FLAGS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
