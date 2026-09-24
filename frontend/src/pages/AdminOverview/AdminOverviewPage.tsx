import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useLanguage } from '@/i18n/useLanguage'
import './AdminOverviewPage.scss'

export function AdminOverviewPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="admin-overview">
      <section className="admin-overview__intro">
        <div>
          <p className="admin-overview__eyebrow">{t.admin.overviewEyebrow}</p>
          <h2>{t.admin.overviewTitle}</h2>
          <p>{t.admin.overviewDescription}</p>
        </div>
        <span className="admin-overview__status"><i aria-hidden="true" />{t.admin.foundationReady}</span>
      </section>

      <div className="admin-overview__context-grid">
        <section className="admin-overview__administrator">
          <div className="admin-overview__context-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.7 2.9 8.2 7 10 4.1-1.8 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
          </div>
          <div>
            <span>{t.admin.signedInAdministrator}</span>
            <strong>{user?.email}</strong>
            <small>{t.admin.authorizationContext}</small>
          </div>
        </section>
        <section className="admin-overview__notice">
          <span>{t.admin.consoleScope}</span>
          <p>{t.admin.consoleScopeDescription}</p>
        </section>
      </div>

      <section className="admin-overview__modules" aria-labelledby="admin-modules-title">
        <div className="admin-overview__section-heading">
          <div>
            <p>{t.admin.managementAreasEyebrow}</p>
            <h3 id="admin-modules-title">{t.admin.managementAreas}</h3>
          </div>
        </div>

        <div className="admin-overview__module-grid">
          <Link className="admin-module-card admin-module-card--available" to="/admin/users">
            <div className="admin-module-card__topline">
              <span className="admin-module-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5A6.5 6.5 0 0 1 12 12a6.5 6.5 0 0 1 6.5 6.5V20" /></svg>
              </span>
              <span className="admin-module-card__badge">{t.admin.available}</span>
            </div>
            <h4>{t.admin.modules.users.title}</h4>
            <p>{t.admin.modules.users.description}</p>
            <div className="admin-module-card__footer" aria-hidden="true">
              <span>{t.admin.openModule}</span>
              <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
