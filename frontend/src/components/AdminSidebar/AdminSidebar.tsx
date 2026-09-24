import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '@/i18n/useLanguage'
import './AdminSidebar.scss'

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

        <section className="admin-sidebar__section" aria-labelledby="admin-nav-authentication">
          <h2 id="admin-nav-authentication">{t.admin.sections.authentication}</h2>
          <NavLink
            className={({ isActive }) => `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`}
            to="/admin/users"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20v-1.5A6.5 6.5 0 0 1 12 12a6.5 6.5 0 0 1 6.5 6.5V20" /></svg>
            <span>{t.admin.modules.users.title}</span>
          </NavLink>
        </section>
      </nav>

      <Link className="admin-sidebar__return" to="/">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 17-5-5 5-5M5 12h14" /></svg>
        <span>{t.admin.returnToApplication}</span>
      </Link>
    </aside>
  )
}
