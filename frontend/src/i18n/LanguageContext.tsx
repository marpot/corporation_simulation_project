import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { translations, type Language } from './translations'
import { LanguageContext } from './language-context'

const LANGUAGE_STORAGE_KEY = 'corp-ops-language'

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'pl' ? 'pl' : 'en'
  } catch {
    return 'en'
  }
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // The UI still works when storage is unavailable.
    }
  }, [language])

  const value = useMemo(
    () => ({ language, setLanguage, t: translations[language] }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
