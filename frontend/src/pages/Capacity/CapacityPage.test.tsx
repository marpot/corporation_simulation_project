import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '../../i18n/language-context'
import { translations } from '../../i18n/translations'
import { getEmployeeCapacities } from '../../services/capacity'
import type { User, UserRole } from '../../types/auth'
import type { EmployeeCapacity } from '../../types/capacity'
import { CapacityPage } from './CapacityPage'

vi.mock('../../services/capacity', () => ({ getEmployeeCapacities: vi.fn() }))

const getEmployeeCapacitiesMock = vi.mocked(getEmployeeCapacities)

const capacities: EmployeeCapacity[] = [
  {
    employee_id: 1,
    employee_name: 'Anna Nowak',
    allocated_percent: 70,
    available_percent: 30,
    status: 'AVAILABLE',
  },
  {
    employee_id: 2,
    employee_name: 'Jan Kowalski',
    allocated_percent: 100,
    available_percent: 0,
    status: 'FULLY_ALLOCATED',
  },
  {
    employee_id: 3,
    employee_name: 'Adam Smith',
    allocated_percent: 130,
    available_percent: 0,
    status: 'OVERALLOCATED',
  },
]

function renderPage(role: UserRole = 'EMPLOYEE', language: 'en' | 'pl' = 'en') {
  const currentUser: User = {
    id: 99,
    email: `${role.toLowerCase()}@example.com`,
    role,
    is_active: true,
  }
  const authValue: AuthContextValue = {
    user: currentUser,
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
          <CapacityPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )
}

function rowFor(employeeName: string) {
  const row = screen.getByText(employeeName).closest('tr')
  if (!row) throw new Error(`Capacity row for ${employeeName} not found`)
  return row
}

describe('CapacityPage', () => {
  beforeEach(() => {
    getEmployeeCapacitiesMock.mockReset()
    getEmployeeCapacitiesMock.mockResolvedValue(capacities)
  })

  it('renders the capacity page and its initial loading state', () => {
    getEmployeeCapacitiesMock.mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(screen.getByRole('heading', { name: 'Resource Capacity', level: 2 })).toBeInTheDocument()
    expect(screen.getByLabelText('Selected date')).toHaveAttribute('type', 'date')
    expect(screen.getByRole('status')).toHaveTextContent('Loading employee capacity…')
  })

  it('renders employee percentages and all translated statuses', async () => {
    renderPage()

    expect(await screen.findByText('Anna Nowak')).toBeInTheDocument()
    expect(within(rowFor('Anna Nowak')).getByText('70%')).toBeInTheDocument()
    expect(within(rowFor('Anna Nowak')).getByText('30%')).toBeInTheDocument()
    expect(within(rowFor('Anna Nowak')).getByText('Available')).toBeInTheDocument()
    expect(within(rowFor('Jan Kowalski')).getByText('Fully allocated')).toBeInTheDocument()
    expect(within(rowFor('Adam Smith')).getByText('Overallocated')).toBeInTheDocument()
  })

  it('calculates summary counts from the response', async () => {
    renderPage()

    const summary = await screen.findByRole('region', { name: 'Capacity summary' })
    const summaryItems = within(summary).getAllByRole('article')
    expect(summaryItems).toHaveLength(4)
    expect(summaryItems[0]).toHaveTextContent('Employees3')
    expect(summaryItems[1]).toHaveTextContent('Available1')
    expect(summaryItems[2]).toHaveTextContent('Fully allocated1')
    expect(summaryItems[3]).toHaveTextContent('Overallocated1')
  })

  it('loads a changed date and hides results from the previous date', async () => {
    let resolveChangedDate: (items: EmployeeCapacity[]) => void = () => undefined
    getEmployeeCapacitiesMock
      .mockResolvedValueOnce(capacities)
      .mockReturnValueOnce(new Promise((resolve) => { resolveChangedDate = resolve }))
    renderPage()
    await screen.findByText('Anna Nowak')

    const dateInput = screen.getByLabelText('Selected date')
    fireEvent.change(dateInput, { target: { value: '2026-11-01' } })

    await waitFor(() => expect(getEmployeeCapacitiesMock).toHaveBeenLastCalledWith('2026-11-01'))
    expect(screen.getByRole('status')).toHaveTextContent('Loading employee capacity…')
    expect(screen.queryByText('Anna Nowak')).not.toBeInTheDocument()

    resolveChangedDate([])
    expect(await screen.findByText('No active employees')).toBeInTheDocument()
  })

  it('shows a useful empty state', async () => {
    getEmployeeCapacitiesMock.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No active employees')).toBeInTheDocument()
    expect(screen.getByText('There are no active employees to display for this capacity overview.')).toBeInTheDocument()
  })

  it('shows a friendly error without stale or raw server output', async () => {
    getEmployeeCapacitiesMock.mockRejectedValue(new Error('database connection details'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Employee capacity could not be loaded')
    expect(screen.queryByText('database connection details')).not.toBeInTheDocument()
    expect(screen.queryByText('Anna Nowak')).not.toBeInTheDocument()
  })

  it('retries the selected date after a loading error', async () => {
    getEmployeeCapacitiesMock
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(capacities)
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Anna Nowak')).toBeInTheDocument()
    expect(getEmployeeCapacitiesMock).toHaveBeenCalledTimes(2)
    expect(getEmployeeCapacitiesMock.mock.calls[1]).toEqual(getEmployeeCapacitiesMock.mock.calls[0])
  })

  it.each<UserRole>(['ADMIN', 'MANAGER', 'EMPLOYEE'])('%s receives the same read-only view', async (role) => {
    renderPage(role)

    expect(await screen.findByText('Anna Nowak')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/create|edit|delete/i)).not.toBeInTheDocument()
  })

  it('renders status labels through the Polish translations', async () => {
    renderPage('EMPLOYEE', 'pl')

    expect(await screen.findByRole('heading', { name: 'Obciążenie pracowników', level: 2 })).toBeInTheDocument()
    expect(within(rowFor('Anna Nowak')).getByText('Dostępny')).toBeInTheDocument()
    expect(within(rowFor('Jan Kowalski')).getByText('W pełni przydzielony')).toBeInTheDocument()
    expect(within(rowFor('Adam Smith')).getByText('Przeciążony')).toBeInTheDocument()
  })
})
