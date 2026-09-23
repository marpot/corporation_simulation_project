import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useLanguage } from '@/i18n/useLanguage'
import { LanguageSelector } from '@/components/LanguageSelector/LanguageSelector'
import './AdminHeader.scss'

export function AdminHeader() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const avatarLabel = user?.email.slice(0, 2).toUpperCase() ?? ''

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="admin-header">
      <div className="admin-header__title">
        <p>{t.admin.headerEyebrow}</p>
        <h1>{t.admin.headerTitle}</h1>
      </div>
      <div className="admin-header__actions">
        <LanguageSelector />
        <div className="admin-header__account">
          <span className="admin-header__avatar" aria-hidden="true">{avatarLabel}</span>
          <span className="admin-header__identity">
            <strong>{user?.email}</strong>
            <small>{t.admin.adminRole}</small>
          </span>
          <button type="button" onClick={handleLogout}>{t.header.signOut}</button>
        </div>
      </div>
    </header>
  )
}
