import { createContext } from 'react'
import type { Language, Translation } from './translations'

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: Translation
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
