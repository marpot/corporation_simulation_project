import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import { LoginPage } from './LoginPage'

const login = vi.fn<AuthContextValue['login']>()

const authValue: AuthContextValue = {
  user: null,
  isLoading: false,
  login,
  logout: vi.fn(),
}

const languageValue: LanguageContextValue = {
  language: 'en',
  setLanguage: vi.fn(),
  t: translations.en,
}

describe('LoginPage', () => {
  it('shows the public demo administrator and fills the form without submitting', async () => {
    const user = userEvent.setup()
    render(
      <LanguageContext.Provider value={languageValue}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </AuthContext.Provider>
      </LanguageContext.Provider>,
    )

    expect(screen.getByRole('heading', { name: 'Demo account' })).toBeInTheDocument()
    expect(screen.getByText('demo@corporation.local')).toBeInTheDocument()
    expect(screen.getByText('Demo123!')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Use demo account' }))

    expect(screen.getByLabelText('Work email')).toHaveValue('demo@corporation.local')
    expect(screen.getByLabelText('Password')).toHaveValue('Demo123!')
    expect(login).not.toHaveBeenCalled()
  })
})
