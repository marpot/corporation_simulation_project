import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import type { User } from '@/types/auth'
import { AdminOverviewPage } from './AdminOverviewPage'

const admin: User = {
  id: 1,
  email: 'admin@example.com',
  role: 'ADMIN',
  is_active: true,
}

const authValue: AuthContextValue = {
  user: admin,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

const languageValue: LanguageContextValue = {
  language: 'en',
  setLanguage: vi.fn(),
  t: translations.en,
}

describe('AdminOverviewPage', () => {
  it('renders the access-management overview with only the Users module', () => {
    render(
      <LanguageContext.Provider value={languageValue}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <AdminOverviewPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </LanguageContext.Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Corporation administration' })).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Users/ })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Open module')).toBeInTheDocument()
    expect(screen.queryByText('Employees')).not.toBeInTheDocument()
    expect(screen.queryByText('Departments')).not.toBeInTheDocument()
    expect(screen.queryByText('Projects')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
