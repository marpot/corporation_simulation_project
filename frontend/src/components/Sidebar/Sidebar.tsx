import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '@/i18n/useLanguage'
import './Sidebar.scss'

interface NavigationItem {
  labelKey: 'dashboard' | 'employees' | 'departments' | 'projects' | 'assignments' | 'skills' | 'capacity' | 'matching'
  to: string
  icon: ReactNode
}

const navigationItems: NavigationItem[] = [
  { labelKey: 'dashboard', to: '/', icon: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /> },
  { labelKey: 'employees', to: '/employees', icon: <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 20v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" /> },
  { labelKey: 'departments', to: '/departments', icon: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h1M14 10h1M9 14h1M14 14h1M10 21v-3h4v3" /> },
  { labelKey: 'projects', to: '/projects', icon: <path d="M3 7h18v13H3zM8 7V4h8v3M3 12h18M10 12v2h4v-2" /> },
  { labelKey: 'assignments', to: '/assignments', icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /> },
  { labelKey: 'skills', to: '/skills', icon: <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4ZM9 12l2 2 4-5" /> },
  { labelKey: 'capacity', to: '/capacity', icon: <path d="M4 19V9M10 19V5M16 19v-7M22 19V3M2 19h22" /> },
  { labelKey: 'matching', to: '/matching', icon: <path d="M4 6h6M14 6h6M8 3l3 3-3 3M20 18h-6M10 18H4M16 15l-3 3 3 3M12 6v12" /> },
]

export function Sidebar() {
  const { t } = useLanguage()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">CO</span>
        <span className="sidebar__brand-copy">
          <strong>CORP OPS</strong>
          <small>{t.brand.subtitle}</small>
        </span>
      </div>

      <nav className="sidebar__navigation" aria-label={t.sidebar.navigationLabel}>
        <span className="sidebar__section-label">{t.sidebar.section}</span>
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
            <span>{t.sidebar[item.labelKey]}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__environment-dot" aria-hidden="true" />
        <span>{t.sidebar.environment}</span>
      </div>
    </aside>
  )
}
