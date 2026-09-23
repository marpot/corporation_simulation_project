import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../../auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '../../i18n/language-context'
import { translations, type Language } from '../../i18n/translations'
import { getDepartments } from '../../services/departments'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '../../services/employees'
import type { Department } from '../../types/department'
import type { Employee } from '../../types/employee'
import type { User } from '../../types/auth'
import { EmployeesPage } from './EmployeesPage'

vi.mock('../../services/departments', () => ({
  getDepartments: vi.fn(),
}))

vi.mock('../../services/employees', () => ({
  createEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  getEmployees: vi.fn(),
  updateEmployee: vi.fn(),
}))

const getDepartmentsMock = vi.mocked(getDepartments)
const getEmployeesMock = vi.mocked(getEmployees)
const createEmployeeMock = vi.mocked(createEmployee)
const updateEmployeeMock = vi.mocked(updateEmployee)
const deleteEmployeeMock = vi.mocked(deleteEmployee)

const manager: User = {
  id: 10,
  email: 'manager@example.com',
  role: 'MANAGER',
  is_active: true,
}

const departments: Department[] = [
  { id: 1, name: 'Engineering', description: null, active: true },
  { id: 2, name: 'Sales', description: null, active: true },
  { id: 3, name: 'Legacy Operations', description: null, active: false },
]

const employees: Employee[] = [
  {
    id: 1,
    first_name: 'Alice',
    last_name: 'Adams',
    position: 'Engineer',
    seniority: 'SENIOR',
    weekly_capacity: 40,
    active: true,
    user_id: null,
    department_id: 1,
  },
  {
    id: 2,
    first_name: 'Bob',
    last_name: 'Brown',
    position: 'Designer',
    seniority: 'MID',
    weekly_capacity: 32,
    active: true,
    user_id: null,
    department_id: null,
  },
]

function renderPage(language: Language = 'en') {
  const authValue: AuthContextValue = {
    user: manager,
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
          <EmployeesPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )
}

function rowFor(name: string) {
  const row = screen.getByText(name).closest('tr')
  if (!row) throw new Error(`No employee row found for ${name}`)
  return row
}

async function openCreateForm() {
  const user = userEvent.setup()
  await screen.findByText('Engineering')
  await user.click(screen.getByRole('button', { name: 'Create employee' }))
  return user
}

async function fillRequiredCreateFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('First name'), 'Casey')
  await user.type(screen.getByLabelText('Last name'), 'Clark')
  await user.type(screen.getByLabelText('Position'), 'Analyst')
}

describe('EmployeesPage departments', () => {
  beforeEach(() => {
    getDepartmentsMock.mockReset()
    getEmployeesMock.mockReset()
    createEmployeeMock.mockReset()
    updateEmployeeMock.mockReset()
    deleteEmployeeMock.mockReset()
    getDepartmentsMock.mockResolvedValue(departments)
    getEmployeesMock.mockResolvedValue(employees)
  })

  it('shows department names and an unassigned value without per-employee requests', async () => {
    renderPage()

    await screen.findByText('Alice Adams')
    expect(within(rowFor('Alice Adams')).getByText('Engineering')).toBeInTheDocument()
    expect(within(rowFor('Bob Brown')).getByText('Unassigned')).toBeInTheDocument()
    expect(getDepartmentsMock).toHaveBeenCalledTimes(1)
  })

  it('renders an API null department as unassigned in Polish, not unavailable', async () => {
    getEmployeesMock.mockResolvedValue([employees[1]])
    renderPage('pl')

    await screen.findByText('Bob Brown')
    const employeeRow = rowFor('Bob Brown')
    expect(within(employeeRow).getByText('Nieprzypisany')).toBeInTheDocument()
    expect(within(employeeRow).queryByText('Dział niedostępny')).not.toBeInTheDocument()
  })

  it('creates an employee with a selected department', async () => {
    const createdEmployee: Employee = {
      ...employees[0],
      id: 3,
      first_name: 'Casey',
      last_name: 'Clark',
      position: 'Analyst',
      seniority: 'MID',
      department_id: 2,
    }
    createEmployeeMock.mockResolvedValue(createdEmployee)
    renderPage()
    const user = await openCreateForm()

    await fillRequiredCreateFields(user)
    await user.selectOptions(screen.getByLabelText('Department'), '2')
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(createEmployeeMock).toHaveBeenCalledWith({
      first_name: 'Casey',
      last_name: 'Clark',
      position: 'Analyst',
      seniority: 'MID',
      weekly_capacity: 40,
      active: true,
      department_id: 2,
    }))
    expect(within(rowFor('Casey Clark')).getByText('Sales')).toBeInTheDocument()
  })

  it('creates an employee as unassigned', async () => {
    createEmployeeMock.mockResolvedValue({
      ...employees[1],
      id: 3,
      first_name: 'Casey',
      last_name: 'Clark',
      position: 'Analyst',
    })
    renderPage()
    const user = await openCreateForm()

    await fillRequiredCreateFields(user)
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(createEmployeeMock).toHaveBeenCalledWith(expect.objectContaining({
      department_id: null,
    })))
    expect(within(rowFor('Casey Clark')).getByText('Unassigned')).toBeInTheDocument()
  })

  it('preselects an inactive existing department without offering it for new assignments', async () => {
    getEmployeesMock.mockResolvedValue([{ ...employees[0], department_id: 3 }])
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Alice Adams')
    const employeeRow = rowFor('Alice Adams')
    await user.click(within(employeeRow).getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Department')).toHaveValue('3')
    expect(screen.getByRole('option', { name: 'Legacy Operations (Inactive)' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Create employee' }))
    expect(screen.queryByRole('option', { name: 'Legacy Operations (Inactive)' })).not.toBeInTheDocument()
  })

  it('moves an employee to another department', async () => {
    const movedEmployee = { ...employees[0], department_id: 2 }
    updateEmployeeMock.mockResolvedValue(movedEmployee)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Alice Adams')
    await user.click(within(rowFor('Alice Adams')).getByRole('button', { name: 'Edit' }))
    await user.selectOptions(screen.getByLabelText('Department'), '2')
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(updateEmployeeMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ department_id: 2 }),
    ))
    expect(within(rowFor('Alice Adams')).getByText('Sales')).toBeInTheDocument()
  })

  it('clears an employee department assignment', async () => {
    const unassignedEmployee = { ...employees[0], department_id: null }
    updateEmployeeMock.mockResolvedValue(unassignedEmployee)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Alice Adams')
    await user.click(within(rowFor('Alice Adams')).getByRole('button', { name: 'Edit' }))
    await user.selectOptions(screen.getByLabelText('Department'), '')
    await user.click(screen.getByRole('button', { name: 'Save employee' }))

    await waitFor(() => expect(updateEmployeeMock).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ department_id: null }),
    ))
    expect(within(rowFor('Alice Adams')).getByText('Unassigned')).toBeInTheDocument()
  })

  it('keeps employees usable and retries when department loading fails', async () => {
    getDepartmentsMock
      .mockRejectedValueOnce(new Error('raw department service failure'))
      .mockResolvedValueOnce(departments)
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    expect(await screen.findByText('Departments could not be loaded. Employee records remain available.')).toBeInTheDocument()
    expect(screen.queryByText('raw department service failure')).not.toBeInTheDocument()
    expect(within(rowFor('Alice Adams')).getByText('Department unavailable')).toBeInTheDocument()
    expect(within(rowFor('Bob Brown')).getByText('Unassigned')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create employee' }))
    expect(screen.getByLabelText('Department')).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Reload departments' }))

    await waitFor(() => expect(screen.getByLabelText('Department')).toBeEnabled())
    expect(screen.getByRole('option', { name: 'Engineering' })).toBeInTheDocument()
    expect(getDepartmentsMock).toHaveBeenCalledTimes(2)
  })

  it('shows department loading in the form without blocking loaded employees', async () => {
    getDepartmentsMock.mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create employee' }))

    expect(screen.getByLabelText('Department')).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Loading departments…' })).toBeInTheDocument()
  })
})
