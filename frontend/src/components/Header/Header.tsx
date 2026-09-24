import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { LanguageSelector } from '@/components/LanguageSelector/LanguageSelector'
import { useLanguage } from '@/i18n/useLanguage'
import './Header.scss'

const pageTitleKeys: Record<string, 'dashboard' | 'employees' | 'departments' | 'projects' | 'assignments' | 'skills' | 'capacity'> = {
  '/': 'dashboard',
  '/employees': 'employees',
  '/departments': 'departments',
  '/projects': 'projects',
  '/assignments': 'assignments',
  '/skills': 'skills',
  '/capacity': 'capacity',
}

export function Header() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const pageTitle = t.header.pages[pageTitleKeys[pathname] ?? 'dashboard']
  const avatarLabel = user?.email.slice(0, 2).toUpperCase() ?? ''

  function handleLogout() {
    logout()
    void navigate('/login', { replace: true })
  }

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
          <span className="header__avatar" aria-hidden="true">{avatarLabel}</span>
          <span className="header__account-copy">
            <strong>{user?.email}</strong>
            <small>{user ? t.header.roles[user.role] : ''}</small>
          </span>
          <button type="button" onClick={handleLogout}>{t.header.signOut}</button>
        </div>
      </div>
    </header>
  )
}
