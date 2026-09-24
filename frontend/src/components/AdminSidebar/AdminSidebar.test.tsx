import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import { AdminSidebar } from './AdminSidebar'

const languageValue: LanguageContextValue = {
  language: 'en',
  setLanguage: vi.fn(),
  t: translations.en,
}

describe('AdminSidebar', () => {
  it('shows only overview, user administration, and return navigation', () => {
    render(
      <LanguageContext.Provider value={languageValue}>
        <MemoryRouter>
          <AdminSidebar />
        </MemoryRouter>
      </LanguageContext.Provider>,
    )

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: 'Return to application' })).toHaveAttribute('href', '/')
    expect(screen.queryByText('Employees')).not.toBeInTheDocument()
    expect(screen.queryByText('Departments')).not.toBeInTheDocument()
    expect(screen.queryByText('Projects')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument()
  })
})
