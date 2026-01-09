import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { en } from '../i18n/en'
import { zh } from '../i18n/zh'
import { Translations, TranslationKey } from '../i18n/types'

type Locale = 'en' | 'zh'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('locale')
    return saved === 'en' || saved === 'zh' ? saved : 'zh' // Default to zh as requested
  })

  useEffect(() => {
    localStorage.setItem('locale', locale)
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
  }

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dictionary = locale === 'zh' ? zh : en
    let text = dictionary[key] || key

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue))
      })
    }

    return text
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
