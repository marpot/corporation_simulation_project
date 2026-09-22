import { useLocation, useNavigate } from 'react-router-dom'
import { LanguageSelector } from '../LanguageSelector/LanguageSelector'
import { useLanguage } from '../../i18n/useLanguage'
import './Header.scss'

const pageTitleKeys: Record<string, 'dashboard' | 'employees' | 'departments' | 'projects'> = {
  '/': 'dashboard',
  '/employees': 'employees',
  '/departments': 'departments',
  '/projects': 'projects',
}

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const pageTitle = t.header.pages[pageTitleKeys[pathname] ?? 'dashboard']

  return (
    <header className="header">
      <div>
        <p className="header__eyebrow">{t.header.eyebrow}</p>
        <h1>{pageTitle}</h1>
      </div>
      <div className="header__actions">
        <LanguageSelector />
        <div className="header__context" aria-label={t.header.reportingPeriodLabel}>
          <span className="header__context-label">{t.header.reportingPeriod}</span>
          <strong>{t.header.reportingPeriodValue}</strong>
        </div>
        <div className="header__account">
          <span className="header__avatar" aria-hidden="true">MK</span>
          <span className="header__account-copy">
            <strong>Marta Kowalska</strong>
            <small>{t.header.accountRole}</small>
          </span>
          <button type="button" onClick={() => navigate('/login')}>{t.header.signOut}</button>
        </div>
      </div>
    </header>
  )
}
