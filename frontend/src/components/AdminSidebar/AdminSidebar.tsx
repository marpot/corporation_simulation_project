import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/useLanguage'
import './AdminSidebar.scss'

type AdminNavigationKey = 'users' | 'employees' | 'departments' | 'projects'

interface PlannedNavigationItem {
  key: AdminNavigationKey
  icon: ReactNode
}

const sections: Array<{ key: 'authentication' | 'organization' | 'projectManagement'; items: PlannedNavigationItem[] }> = [
  {
    key: 'authentication',
    items: [{ key: 'users', icon: <><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5A6.5 6.5 0 0 1 12 12a6.5 6.5 0 0 1 6.5 6.5V20" /></> }],
  },
  {
    key: 'organization',
    items: [
      { key: 'employees', icon: <><path d="M15.5 19.5v-1.25a4.75 4.75 0 0 0-4.75-4.75h-4A4.75 4.75 0 0 0 2 18.25v1.25" /><circle cx="8.75" cy="6.75" r="3.75" /><path d="M16 4.2a3.75 3.75 0 0 1 0 7.1M22 19.5v-1.25a4.75 4.75 0 0 0-3.6-4.61" /></> },
      { key: 'departments', icon: <><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-3h4v3" /></> },
    ],
  },
  {
    key: 'projectManagement',
    items: [{ key: 'projects', icon: <><path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18M10 12v2h4v-2" /></> }],
  },
]

export function AdminSidebar() {
  const { t } = useLanguage()

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__brand-mark" aria-hidden="true">CA</span>
        <span className="admin-sidebar__brand-copy">
          <strong>CORPORATION</strong>
          <small>{t.admin.brand}</small>
        </span>
      </div>

      <nav className="admin-sidebar__navigation" aria-label={t.admin.navigationLabel}>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></svg>
          <span>{t.admin.overview}</span>
        </NavLink>

        {sections.map((section) => (
          <section className="admin-sidebar__section" key={section.key} aria-labelledby={`admin-nav-${section.key}`}>
            <h2 id={`admin-nav-${section.key}`}>{t.admin.sections[section.key]}</h2>
            {section.items.map((item) => (
              <div className="admin-sidebar__link admin-sidebar__link--disabled" key={item.key} aria-disabled="true">
                <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
                <span>{t.admin.modules[item.key].title}</span>
                <small>{t.admin.comingSoon}</small>
              </div>
            ))}
          </section>
        ))}
      </nav>

      <Link className="admin-sidebar__return" to="/">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 17-5-5 5-5M5 12h14" /></svg>
        <span>{t.admin.returnToApplication}</span>
      </Link>
    </aside>
  )
}
