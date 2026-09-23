import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '../../i18n/language-context'
import { translations, type Language } from '../../i18n/translations'
import {
  changeAdminUserPassword,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../../services/adminUsers'
import { ApiError } from '../../services/api'
import type { AdminUser } from '../../types/adminUser'
import type { User } from '../../types/auth'
import { AdminUsersPage } from './AdminUsersPage'

vi.mock('../../services/adminUsers', () => ({
  changeAdminUserPassword: vi.fn(),
  createAdminUser: vi.fn(),
  getAdminUsers: vi.fn(),
  updateAdminUser: vi.fn(),
}))

const getUsersMock = vi.mocked(getAdminUsers)
const createUserMock = vi.mocked(createAdminUser)
const updateUserMock = vi.mocked(updateAdminUser)
const changePasswordMock = vi.mocked(changeAdminUserPassword)

const currentAdmin: User = {
  id: 1,
  email: 'admin@example.com',
  role: 'ADMIN',
  is_active: true,
}

const accountUsers: AdminUser[] = [
  currentAdmin,
  {
    id: 2,
    email: 'employee@example.com',
    role: 'EMPLOYEE',
    is_active: false,
  },
]

function renderPage(language: Language = 'en') {
  const authValue: AuthContextValue = {
    user: currentAdmin,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }
  const languageValue: LanguageContextValue = {
    language,
    setLanguage: vi.fn(),
    t: translations[language],
  }

  return render(
    <LanguageContext.Provider value={languageValue}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )
}

function rowFor(email: string) {
  const row = screen.getByText(email).closest('tr')
  if (!row) throw new Error(`No account row found for ${email}`)
  return row
}

async function openCreateDialog() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Create user' }))
  return { user, dialog: screen.getByRole('dialog', { name: 'Create user' }) }
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    getUsersMock.mockReset()
    createUserMock.mockReset()
    updateUserMock.mockReset()
    changePasswordMock.mockReset()
  })

  it('shows a loading state while accounts are being fetched', () => {
    getUsersMock.mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading user accounts…')
  })

  it('renders loaded accounts, roles, statuses, and the user count', async () => {
    getUsersMock.mockResolvedValue(accountUsers)

    renderPage()

    expect(await screen.findByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('employee@example.com')).toBeInTheDocument()
    expect(within(rowFor('admin@example.com')).getByText('ADMIN')).toBeInTheDocument()
    expect(within(rowFor('admin@example.com')).getByText('Active')).toBeInTheDocument()
    expect(within(rowFor('employee@example.com')).getByText('EMPLOYEE')).toBeInTheDocument()
    expect(within(rowFor('employee@example.com')).getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('2 users')).toBeInTheDocument()
  })

  it('shows a friendly load error and retries the request', async () => {
    getUsersMock
      .mockRejectedValueOnce(new Error('raw upstream failure'))
      .mockResolvedValueOnce(accountUsers)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('User accounts could not be loaded')).toBeInTheDocument()
    expect(screen.queryByText('raw upstream failure')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('employee@example.com')).toBeInTheDocument()
    expect(getUsersMock).toHaveBeenCalledTimes(2)
  })

  it('shows the empty state when no accounts exist', async () => {
    getUsersMock.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No user accounts yet')).toBeInTheDocument()
    expect(screen.getByText('Create the first account to provide access to the application.')).toBeInTheDocument()
  })

  it('creates an account and renders success feedback', async () => {
    const createdUser: AdminUser = {
      id: 3,
      email: 'manager@example.com',
      role: 'MANAGER',
      is_active: true,
    }
    getUsersMock.mockResolvedValue(accountUsers)
    createUserMock.mockResolvedValue(createdUser)
    renderPage()
    await screen.findByText('employee@example.com')
    const { user, dialog } = await openCreateDialog()

    await user.type(within(dialog).getByLabelText('Email address'), 'manager@example.com')
    await user.type(within(dialog).getByLabelText(/^Password/), 'valid-pass')
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'MANAGER')
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }))

    expect(createUserMock).toHaveBeenCalledWith({
      email: 'manager@example.com',
      password: 'valid-pass',
      role: 'MANAGER',
      is_active: true,
    })
    expect(await screen.findByText('manager@example.com')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Account created for manager@example.com.')
  })

  it.each([
    {
      name: 'a short password',
      email: 'valid@example.com',
      password: 'short',
      error: 'The password must contain at least 8 characters.',
    },
    {
      name: 'a whitespace-only password',
      email: 'valid@example.com',
      password: '        ',
      error: 'Enter a password that is not blank.',
    },
    {
      name: 'an invalid email',
      email: 'invalid-email',
      password: 'valid-pass',
      error: 'Enter a valid email address.',
    },
  ])('rejects $name before calling the create service', async ({ email, password, error }) => {
    getUsersMock.mockResolvedValue(accountUsers)
    renderPage()
    await screen.findByText('employee@example.com')
    const { user, dialog } = await openCreateDialog()

    await user.type(within(dialog).getByLabelText('Email address'), email)
    await user.type(within(dialog).getByLabelText(/^Password/), password)
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(error)
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('shows friendly feedback for a duplicate email conflict', async () => {
    getUsersMock.mockResolvedValue(accountUsers)
    createUserMock.mockRejectedValue(new ApiError(409))
    renderPage()
    await screen.findByText('employee@example.com')
    const { user, dialog } = await openCreateDialog()

    await user.type(within(dialog).getByLabelText('Email address'), 'admin@example.com')
    await user.type(within(dialog).getByLabelText(/^Password/), 'valid-pass')
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('An account with this email address already exists.')
    expect(screen.queryByText('API request failed')).not.toBeInTheDocument()
  })

  it('edits another account and reflects the returned update', async () => {
    const updatedUser: AdminUser = {
      id: 2,
      email: 'manager@example.com',
      role: 'MANAGER',
      is_active: true,
    }
    getUsersMock.mockResolvedValue(accountUsers)
    updateUserMock.mockResolvedValue(updatedUser)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('employee@example.com')

    await user.click(within(rowFor('employee@example.com')).getByRole('button', { name: 'Edit account' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit user' })
    const emailInput = within(dialog).getByLabelText('Email address')
    await user.clear(emailInput)
    await user.type(emailInput, 'manager@example.com')
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'MANAGER')
    await user.click(within(dialog).getByLabelText('Active account'))
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(updateUserMock).toHaveBeenCalledWith(2, {
      email: 'manager@example.com',
      role: 'MANAGER',
      is_active: true,
    })
    expect(await screen.findByText('manager@example.com')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Account updated for manager@example.com.')
  })

  it('protects the current administrator role and active status in the edit UI', async () => {
    getUsersMock.mockResolvedValue(accountUsers)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('admin@example.com')

    await user.click(within(rowFor('admin@example.com')).getByRole('button', { name: 'Edit account' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit user' })

    expect(within(dialog).getByLabelText('Role')).toBeDisabled()
    expect(within(dialog).getByLabelText('Active account')).toBeDisabled()
    expect(within(dialog).getByText(/protected to prevent an accidental lockout/i)).toBeInTheDocument()
  })

  it('changes a user password through the separate password dialog', async () => {
    getUsersMock.mockResolvedValue(accountUsers)
    changePasswordMock.mockResolvedValue(accountUsers[1])
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('employee@example.com')

    await user.click(within(rowFor('employee@example.com')).getByRole('button', { name: 'Change password' }))
    const dialog = screen.getByRole('dialog', { name: 'Set new password' })
    await user.type(within(dialog).getByLabelText(/^New password/), 'new-valid-pass')
    await user.click(within(dialog).getByRole('button', { name: 'Set new password' }))

    expect(changePasswordMock).toHaveBeenCalledWith(2, { password: 'new-valid-pass' })
    expect(await screen.findByRole('status')).toHaveTextContent('Password changed for employee@example.com.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each([
    ['short', 'The password must contain at least 8 characters.'],
    ['        ', 'Enter a password that is not blank.'],
  ])('rejects an invalid replacement password', async (password, error) => {
    getUsersMock.mockResolvedValue(accountUsers)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('employee@example.com')

    await user.click(within(rowFor('employee@example.com')).getByRole('button', { name: 'Change password' }))
    const dialog = screen.getByRole('dialog', { name: 'Set new password' })
    await user.type(within(dialog).getByLabelText(/^New password/), password)
    await user.click(within(dialog).getByRole('button', { name: 'Set new password' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(error)
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('clears an entered password when the dialog is closed', async () => {
    getUsersMock.mockResolvedValue(accountUsers)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('employee@example.com')
    const row = rowFor('employee@example.com')

    await user.click(within(row).getByRole('button', { name: 'Change password' }))
    await user.type(screen.getByLabelText(/^New password/), 'temporary-pass')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(within(row).getByRole('button', { name: 'Change password' }))

    expect(screen.getByLabelText(/^New password/)).toHaveValue('')
  })

  it('renders the account experience through the Polish translations', async () => {
    getUsersMock.mockResolvedValue([])

    renderPage('pl')

    expect(screen.getByRole('heading', { name: 'Konta użytkowników' })).toBeInTheDocument()
    expect(await screen.findByText('Brak kont użytkowników')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Utwórz użytkownika' })).toHaveLength(2)
  })
})
