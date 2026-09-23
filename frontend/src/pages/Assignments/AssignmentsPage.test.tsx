import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from '@/services/assignments'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import type { Assignment } from '@/types/assignment'
import type { User, UserRole } from '@/types/auth'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import { AssignmentsPage } from './AssignmentsPage'

vi.mock('@/services/assignments', () => ({
  createAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  getAssignments: vi.fn(),
  updateAssignment: vi.fn(),
}))

vi.mock('@/services/employees', () => ({ getEmployees: vi.fn() }))
vi.mock('@/services/projects', () => ({ getProjects: vi.fn() }))

const createAssignmentMock = vi.mocked(createAssignment)
const deleteAssignmentMock = vi.mocked(deleteAssignment)
const getAssignmentsMock = vi.mocked(getAssignments)
const updateAssignmentMock = vi.mocked(updateAssignment)
const getEmployeesMock = vi.mocked(getEmployees)
const getProjectsMock = vi.mocked(getProjects)

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
    department_id: null,
  },
  {
    id: 2,
    first_name: 'Bob',
    last_name: 'Brown',
    position: 'Designer',
    seniority: 'MID',
    weekly_capacity: 40,
    active: true,
    user_id: null,
    department_id: null,
  },
]

const projects: Project[] = [
  {
    id: 10,
    name: 'Atlas',
    description: null,
    status: 'ACTIVE',
    start_date: '2026-10-01',
    end_date: null,
    active: true,
  },
  {
    id: 11,
    name: 'Borealis',
    description: null,
    status: 'PLANNED',
    start_date: '2026-11-01',
    end_date: null,
    active: true,
  },
]

const assignments: Assignment[] = [
  {
    id: 100,
    employee_id: 1,
    project_id: 10,
    allocation_percent: 50,
    start_date: '2026-10-01',
    end_date: null,
  },
]

function renderPage(role: UserRole = 'MANAGER') {
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
    language: 'en',
    setLanguage: vi.fn(),
    t: translations.en,
  }

  return render(
    <LanguageContext.Provider value={languageValue}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <AssignmentsPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )
}

function assignmentRow() {
  const row = screen.getByText('Atlas').closest('tr')
  if (!row) throw new Error('Assignment row not found')
  return row
}

async function openCreateForm() {
  const user = userEvent.setup()
  await screen.findByText('Alice Adams')
  await user.click(screen.getByRole('button', { name: 'Create assignment' }))
  return user
}

describe('AssignmentsPage', () => {
  beforeEach(() => {
    createAssignmentMock.mockReset()
    deleteAssignmentMock.mockReset()
    getAssignmentsMock.mockReset()
    updateAssignmentMock.mockReset()
    getEmployeesMock.mockReset()
    getProjectsMock.mockReset()
    getAssignmentsMock.mockResolvedValue(assignments)
    getEmployeesMock.mockResolvedValue(employees)
    getProjectsMock.mockResolvedValue(projects)
  })

  it('resolves employee and project names and displays an ongoing assignment', async () => {
    renderPage('EMPLOYEE')

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Ongoing')).toBeInTheDocument()
    expect(getEmployeesMock).toHaveBeenCalledTimes(1)
    expect(getProjectsMock).toHaveBeenCalledTimes(1)
  })

  it('creates an assignment with the selected names and values', async () => {
    const created: Assignment = {
      id: 101,
      employee_id: 2,
      project_id: 11,
      allocation_percent: 80,
      start_date: '2026-11-01',
      end_date: '2026-12-01',
    }
    createAssignmentMock.mockResolvedValue(created)
    renderPage()
    const user = await openCreateForm()

    await user.selectOptions(screen.getByLabelText('Employee'), '2')
    await user.selectOptions(screen.getByLabelText('Project'), '11')
    await user.type(screen.getByLabelText('Allocation percent'), '80')
    await user.type(screen.getByLabelText('Start date'), '2026-11-01')
    await user.type(screen.getByLabelText('End date'), '2026-12-01')
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    await waitFor(() => expect(createAssignmentMock).toHaveBeenCalledWith({
      employee_id: 2,
      project_id: 11,
      allocation_percent: 80,
      start_date: '2026-11-01',
      end_date: '2026-12-01',
    }))
    expect(screen.getByText('Bob Brown')).toBeInTheDocument()
    expect(screen.getByText('Borealis')).toBeInTheDocument()
  })

  it('preselects existing values and updates employee, project, and allocation', async () => {
    const updated = {
      ...assignments[0],
      employee_id: 2,
      project_id: 11,
      allocation_percent: 75,
    }
    updateAssignmentMock.mockResolvedValue(updated)
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Alice Adams')
    await user.click(within(assignmentRow()).getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Employee')).toHaveValue('1')
    expect(screen.getByLabelText('Project')).toHaveValue('10')
    expect(screen.getByLabelText('Allocation percent')).toHaveValue(50)

    await user.selectOptions(screen.getByLabelText('Employee'), '2')
    await user.selectOptions(screen.getByLabelText('Project'), '11')
    await user.clear(screen.getByLabelText('Allocation percent'))
    await user.type(screen.getByLabelText('Allocation percent'), '75')
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    await waitFor(() => expect(updateAssignmentMock).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ employee_id: 2, project_id: 11, allocation_percent: 75 }),
    ))
    expect(screen.getByText('Bob Brown')).toBeInTheDocument()
    expect(screen.getByText('Borealis')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('clears an assignment end date with explicit null', async () => {
    const datedAssignment = { ...assignments[0], end_date: '2026-10-31' }
    getAssignmentsMock.mockResolvedValue([datedAssignment])
    updateAssignmentMock.mockResolvedValue({ ...datedAssignment, end_date: null })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Alice Adams')
    await user.click(within(assignmentRow()).getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('End date'))
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    await waitFor(() => expect(updateAssignmentMock).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ end_date: null }),
    ))
    expect(screen.getByText('Ongoing')).toBeInTheDocument()
  })

  it('deletes an assignment after confirmation', async () => {
    deleteAssignmentMock.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderPage('ADMIN')

    await screen.findByText('Alice Adams')
    await user.click(within(assignmentRow()).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(deleteAssignmentMock).toHaveBeenCalledWith(100))
    expect(screen.queryByText('Atlas')).not.toBeInTheDocument()
    expect(screen.getByText('No assignments yet')).toBeInTheDocument()
    confirm.mockRestore()
  })

  it.each<UserRole>(['ADMIN', 'MANAGER'])('%s users see assignment write controls', async (role) => {
    renderPage(role)

    await screen.findByText('Alice Adams')
    expect(screen.getByRole('button', { name: 'Create assignment' })).toBeInTheDocument()
    expect(within(assignmentRow()).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(within(assignmentRow()).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('keeps the assignment list read-only for EMPLOYEE users', async () => {
    renderPage('EMPLOYEE')

    expect(await screen.findByText('Alice Adams')).toBeInTheDocument()
    expect(screen.getByText('Atlas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create assignment' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it.each([0, 101])('rejects allocation %s before calling the API', async (allocation) => {
    renderPage()
    const user = await openCreateForm()

    await user.selectOptions(screen.getByLabelText('Employee'), '1')
    await user.selectOptions(screen.getByLabelText('Project'), '10')
    await user.type(screen.getByLabelText('Allocation percent'), String(allocation))
    await user.type(screen.getByLabelText('Start date'), '2026-10-01')
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Allocation must be a whole number from 1 to 100.')
    expect(createAssignmentMock).not.toHaveBeenCalled()
  })

  it('rejects an end date before the start date', async () => {
    renderPage()
    const user = await openCreateForm()

    await user.selectOptions(screen.getByLabelText('Employee'), '1')
    await user.selectOptions(screen.getByLabelText('Project'), '10')
    await user.type(screen.getByLabelText('Allocation percent'), '50')
    await user.type(screen.getByLabelText('Start date'), '2026-10-10')
    await user.type(screen.getByLabelText('End date'), '2026-10-09')
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after the start date.')
    expect(createAssignmentMock).not.toHaveBeenCalled()
  })

  it('keeps assignments usable and preserves IDs when supporting metadata fails', async () => {
    getEmployeesMock.mockRejectedValue(new Error('raw employee error'))
    getProjectsMock.mockRejectedValue(new Error('raw project error'))
    updateAssignmentMock.mockResolvedValue({ ...assignments[0], allocation_percent: 60 })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Employee unavailable')).toBeInTheDocument()
    expect(screen.getByText('Project unavailable')).toBeInTheDocument()
    expect(screen.getByText('Employee names could not be loaded. Assignment records remain available.')).toBeInTheDocument()
    expect(screen.getByText('Project names could not be loaded. Assignment records remain available.')).toBeInTheDocument()
    expect(screen.queryByText('raw employee error')).not.toBeInTheDocument()

    const row = screen.getByText('Employee unavailable').closest('tr')
    if (!row) throw new Error('Fallback assignment row not found')
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Employee')).toBeDisabled()
    expect(screen.getByLabelText('Employee')).toHaveValue('1')
    expect(screen.getByLabelText('Project')).toBeDisabled()
    expect(screen.getByLabelText('Project')).toHaveValue('10')

    await user.clear(screen.getByLabelText('Allocation percent'))
    await user.type(screen.getByLabelText('Allocation percent'), '60')
    await user.click(screen.getByRole('button', { name: 'Save assignment' }))

    await waitFor(() => expect(updateAssignmentMock).toHaveBeenCalledWith(
      100,
      expect.objectContaining({ employee_id: 1, project_id: 10, allocation_percent: 60 }),
    ))
  })
})
