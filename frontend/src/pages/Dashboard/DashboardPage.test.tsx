import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import { getAssignments } from '@/services/assignments'
import { ApiError } from '@/services/api'
import { getEmployeeCapacities } from '@/services/capacity'
import { getDepartments } from '@/services/departments'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import type { Assignment } from '@/types/assignment'
import type { User } from '@/types/auth'
import type { EmployeeCapacity } from '@/types/capacity'
import type { Department } from '@/types/department'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import { DashboardPage } from './DashboardPage'

vi.mock('@/services/assignments', () => ({ getAssignments: vi.fn() }))
vi.mock('@/services/capacity', () => ({ getEmployeeCapacities: vi.fn() }))
vi.mock('@/services/departments', () => ({ getDepartments: vi.fn() }))
vi.mock('@/services/employees', () => ({ getEmployees: vi.fn() }))
vi.mock('@/services/projects', () => ({ getProjects: vi.fn() }))

const getAssignmentsMock = vi.mocked(getAssignments)
const getEmployeeCapacitiesMock = vi.mocked(getEmployeeCapacities)
const getDepartmentsMock = vi.mocked(getDepartments)
const getEmployeesMock = vi.mocked(getEmployees)
const getProjectsMock = vi.mocked(getProjects)

const employees: Employee[] = [
  { id: 1, first_name: 'Anna', last_name: 'Nowak', position: 'Engineer', seniority: 'SENIOR', weekly_capacity: 40, active: true, user_id: null, department_id: 10 },
  { id: 2, first_name: 'Jan', last_name: 'Kowalski', position: 'Designer', seniority: 'MID', weekly_capacity: 40, active: false, user_id: null, department_id: 10 },
  { id: 3, first_name: 'Maria', last_name: 'Smith', position: 'Manager', seniority: 'LEAD', weekly_capacity: 40, active: true, user_id: null, department_id: 20 },
]

const departments: Department[] = [
  { id: 10, name: 'Engineering', description: 'Product delivery', active: true },
  { id: 20, name: 'Operations', description: null, active: false },
]

const projects: Project[] = [
  { id: 100, name: 'Atlas', description: null, status: 'ACTIVE', start_date: '2026-01-01', end_date: null, active: true },
  { id: 200, name: 'Portal', description: null, status: 'PLANNED', start_date: '2027-01-01', end_date: '2027-06-30', active: true },
]

const assignments: Assignment[] = [
  { id: 1, employee_id: 1, project_id: 100, allocation_percent: 50, start_date: '2000-01-01', end_date: null },
  { id: 2, employee_id: 3, project_id: 200, allocation_percent: 25, start_date: '2999-01-01', end_date: null },
]

const capacities: EmployeeCapacity[] = [
  { employee_id: 1, employee_name: 'Anna Nowak', allocated_percent: 50, available_percent: 50, status: 'AVAILABLE' },
  { employee_id: 2, employee_name: 'Jan Kowalski', allocated_percent: 100, available_percent: 0, status: 'FULLY_ALLOCATED' },
  { employee_id: 3, employee_name: 'Maria Smith', allocated_percent: 120, available_percent: 0, status: 'OVERALLOCATED' },
]

const currentUser: User = {
  id: 99,
  email: 'manager@example.com',
  role: 'MANAGER',
  is_active: true,
}

function renderPage() {
  const logout = vi.fn()
  const authValue: AuthContextValue = {
    user: currentUser,
    isLoading: false,
    login: vi.fn(),
    logout,
  }
  const languageValue: LanguageContextValue = {
    language: 'en',
    setLanguage: vi.fn(),
    t: translations.en,
  }

  render(
    <LanguageContext.Provider value={languageValue}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<div>Login destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )

  return { logout }
}

function statCard(label: string) {
  const labelElement = screen.getByText(label)
  const card = labelElement.closest<HTMLElement>('article')
  if (!card) throw new Error(`Statistic card for ${label} not found`)
  return card
}

function departmentRow(name: string) {
  const nameElement = screen.getByText(name)
  const row = nameElement.closest<HTMLElement>('.department-overview__row')
  if (!row) throw new Error(`Department row for ${name} not found`)
  return row
}

describe('DashboardPage', () => {
  beforeEach(() => {
    getAssignmentsMock.mockReset().mockResolvedValue(assignments)
    getEmployeeCapacitiesMock.mockReset().mockResolvedValue(capacities)
    getDepartmentsMock.mockReset().mockResolvedValue(departments)
    getEmployeesMock.mockReset().mockResolvedValue(employees)
    getProjectsMock.mockReset().mockResolvedValue(projects)
  })

  it('shows a loading state while dashboard requests are pending', () => {
    getEmployeesMock.mockReturnValue(new Promise(() => undefined))

    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard…')
  })

  it('renders real KPI, capacity, project, and department data', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Company status', level: 2 })).toBeInTheDocument()
    expect(within(statCard('Employees')).getByText('3')).toBeInTheDocument()
    expect(within(statCard('Departments')).getByText('2')).toBeInTheDocument()
    expect(within(statCard('Projects')).getByText('2')).toBeInTheDocument()
    expect(within(statCard('Active assignments')).getByText('1')).toBeInTheDocument()

    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.getByText('Portal')).toBeInTheDocument()
    expect(screen.getByLabelText('Available: 33%')).toBeInTheDocument()
    expect(screen.getByLabelText('Fully allocated: 33%')).toBeInTheDocument()
    expect(screen.getByLabelText('Overallocated: 33%')).toBeInTheDocument()

    expect(within(departmentRow('Engineering')).getByText('Product delivery')).toBeInTheDocument()
    expect(within(departmentRow('Engineering')).getByText('2')).toBeInTheDocument()
    expect(within(departmentRow('Engineering')).getByText('1')).toBeInTheDocument()
    expect(within(departmentRow('Operations')).getByText('No description')).toBeInTheDocument()

    expect(getEmployeesMock).toHaveBeenCalledOnce()
    expect(getDepartmentsMock).toHaveBeenCalledOnce()
    expect(getProjectsMock).toHaveBeenCalledOnce()
    expect(getAssignmentsMock).toHaveBeenCalledOnce()
    expect(getEmployeeCapacitiesMock).toHaveBeenCalledWith()
  })

  it('shows an API error and retries all dashboard data', async () => {
    getProjectsMock
      .mockRejectedValueOnce(new Error('network details'))
      .mockResolvedValueOnce(projects)
    const user = userEvent.setup()
    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Dashboard data could not be loaded.')
    expect(alert).not.toHaveTextContent('network details')

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Atlas')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenCalledTimes(2)
    expect(getDepartmentsMock).toHaveBeenCalledTimes(2)
    expect(getProjectsMock).toHaveBeenCalledTimes(2)
    expect(getAssignmentsMock).toHaveBeenCalledTimes(2)
    expect(getEmployeeCapacitiesMock).toHaveBeenCalledTimes(2)
  })

  it('uses the shared unauthorized handler for a 401 response', async () => {
    getEmployeesMock.mockRejectedValue(new ApiError(401))
    const { logout } = renderPage()

    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    expect(await screen.findByText('Login destination')).toBeInTheDocument()
  })

  it('handles empty API results without rendering empty tables', async () => {
    getAssignmentsMock.mockResolvedValue([])
    getEmployeeCapacitiesMock.mockResolvedValue([])
    getDepartmentsMock.mockResolvedValue([])
    getEmployeesMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('No projects yet')).toBeInTheDocument()
    expect(screen.getByText('No capacity data')).toBeInTheDocument()
    expect(screen.getByText('No departments yet')).toBeInTheDocument()
    expect(within(statCard('Employees')).getByText('0')).toBeInTheDocument()
    expect(within(statCard('Active assignments')).getByText('0')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
