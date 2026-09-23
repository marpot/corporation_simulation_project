import { useLanguage } from '@/i18n/useLanguage'
import type { Language } from '@/i18n/translations'
import './LanguageSelector.scss'

const languageOptions: Array<{ code: Language; label: 'EN' | 'PL' }> = [
  { code: 'en', label: 'EN' },
  { code: 'pl', label: 'PL' },
]

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="language-selector" role="group" aria-label={t.common.languageSelector}>
      {languageOptions.map((option) => (
        <button
          key={option.code}
          type="button"
          aria-pressed={language === option.code}
          aria-label={option.code === 'en' ? t.common.englishLanguage : t.common.polishLanguage}
          onClick={() => setLanguage(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
