import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useLanguage } from '@/i18n/useLanguage'
import './AdminOverviewPage.scss'

type AdminModuleKey = 'users' | 'employees' | 'departments' | 'projects'

const moduleIcons: Record<AdminModuleKey, ReactNode> = {
  users: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5A6.5 6.5 0 0 1 12 12a6.5 6.5 0 0 1 6.5 6.5V20" /></>,
  employees: <><path d="M15.5 19.5v-1.25a4.75 4.75 0 0 0-4.75-4.75h-4A4.75 4.75 0 0 0 2 18.25v1.25" /><circle cx="8.75" cy="6.75" r="3.75" /><path d="M16 4.2a3.75 3.75 0 0 1 0 7.1M22 19.5v-1.25a4.75 4.75 0 0 0-3.6-4.61" /></>,
  departments: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-3h4v3" /></>,
  projects: <><path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18M10 12v2h4v-2" /></>,
}

const moduleKeys = Object.keys(moduleIcons) as AdminModuleKey[]

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
          <span>{t.admin.plannedModules}</span>
        </div>

        <div className="admin-overview__module-grid">
          {moduleKeys.map((key) => {
            const cardContent = (
              <>
              <div className="admin-module-card__topline">
                <span className="admin-module-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">{moduleIcons[key]}</svg>
                </span>
                <span className="admin-module-card__badge">{key === 'users' ? t.admin.available : t.admin.comingSoon}</span>
              </div>
              <h4>{t.admin.modules[key].title}</h4>
              <p>{t.admin.modules[key].description}</p>
              <div className="admin-module-card__footer" aria-hidden="true">
                <span>{key === 'users' ? t.admin.openModule : t.admin.moduleUnavailable}</span>
                <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg>
              </div>
              </>
            )

            return key === 'users' ? (
              <Link className="admin-module-card admin-module-card--available" key={key} to="/admin/users">
                {cardContent}
              </Link>
            ) : (
              <article className="admin-module-card" key={key}>{cardContent}</article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
