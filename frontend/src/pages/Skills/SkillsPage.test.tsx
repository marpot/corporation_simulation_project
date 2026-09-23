import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import { ApiError } from '@/services/api'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import {
  createEmployeeSkill,
  createProjectSkill,
  createSkill,
  deleteEmployeeSkill,
  deleteProjectSkill,
  deleteSkill,
  getEmployeeSkills,
  getProjectSkills,
  getSkills,
  updateEmployeeSkill,
  updateProjectSkill,
  updateSkill,
} from '@/services/skills'
import type { User, UserRole } from '@/types/auth'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import type { EmployeeSkill, ProjectSkill, Skill } from '@/types/skill'
import { SkillsPage } from './SkillsPage'

vi.mock('@/services/employees', () => ({ getEmployees: vi.fn() }))
vi.mock('@/services/projects', () => ({ getProjects: vi.fn() }))
vi.mock('@/services/skills', () => ({
  createEmployeeSkill: vi.fn(), createProjectSkill: vi.fn(), createSkill: vi.fn(),
  deleteEmployeeSkill: vi.fn(), deleteProjectSkill: vi.fn(), deleteSkill: vi.fn(),
  getEmployeeSkills: vi.fn(), getProjectSkills: vi.fn(), getSkills: vi.fn(),
  updateEmployeeSkill: vi.fn(), updateProjectSkill: vi.fn(), updateSkill: vi.fn(),
}))

const mocks = {
  createEmployeeSkill: vi.mocked(createEmployeeSkill), createProjectSkill: vi.mocked(createProjectSkill),
  createSkill: vi.mocked(createSkill), deleteEmployeeSkill: vi.mocked(deleteEmployeeSkill),
  deleteProjectSkill: vi.mocked(deleteProjectSkill), deleteSkill: vi.mocked(deleteSkill),
  getEmployeeSkills: vi.mocked(getEmployeeSkills), getEmployees: vi.mocked(getEmployees),
  getProjectSkills: vi.mocked(getProjectSkills), getProjects: vi.mocked(getProjects),
  getSkills: vi.mocked(getSkills), updateEmployeeSkill: vi.mocked(updateEmployeeSkill),
  updateProjectSkill: vi.mocked(updateProjectSkill), updateSkill: vi.mocked(updateSkill),
}

const skills: Skill[] = [{ id: 1, name: 'Python' }, { id: 2, name: 'React' }]
const employees: Employee[] = [{
  id: 10, first_name: 'Alice', last_name: 'Adams', position: 'Engineer', seniority: 'SENIOR',
  weekly_capacity: 40, active: true, user_id: null, department_id: null,
}]
const projects: Project[] = [{
  id: 20, name: 'Atlas', description: null, status: 'ACTIVE', start_date: '2026-10-01',
  end_date: null, active: true,
}]
const employeeSkills: EmployeeSkill[] = [{ skill_id: 1, skill_name: 'Python', level: 'ADVANCED' }]
const projectSkills: ProjectSkill[] = [{ skill_id: 2, skill_name: 'React', required_level: 'INTERMEDIATE' }]

function renderPage(role: UserRole = 'MANAGER') {
  const currentUser: User = { id: 99, email: 'user@example.com', role, is_active: true }
  const authValue: AuthContextValue = { user: currentUser, isLoading: false, login: vi.fn(), logout: vi.fn() }
  const languageValue: LanguageContextValue = { language: 'en', setLanguage: vi.fn(), t: translations.en }
  return render(<LanguageContext.Provider value={languageValue}><AuthContext.Provider value={authValue}><MemoryRouter><SkillsPage /></MemoryRouter></AuthContext.Provider></LanguageContext.Provider>)
}

function catalogItem(name: string) {
  const item = screen.getByText(name).closest('li')
  if (!item) throw new Error(`Catalog item ${name} not found`)
  return item
}

describe('SkillsPage', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset())
    mocks.getSkills.mockResolvedValue(skills)
    mocks.getEmployees.mockResolvedValue(employees)
    mocks.getProjects.mockResolvedValue(projects)
    mocks.getEmployeeSkills.mockResolvedValue(employeeSkills)
    mocks.getProjectSkills.mockResolvedValue(projectSkills)
  })

  it('renders the page and catalog with a loading state', async () => {
    let resolveSkills: (value: Skill[]) => void = () => undefined
    mocks.getSkills.mockReturnValue(new Promise((resolve) => { resolveSkills = resolve }))
    renderPage()

    expect(screen.getByRole('heading', { name: 'Skills', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('Loading skills…')).toBeInTheDocument()
    resolveSkills(skills)

    expect(await screen.findByText('Python')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('creates a catalog skill and shows success feedback', async () => {
    mocks.createSkill.mockResolvedValue({ id: 3, name: 'SQL' })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.click(screen.getByRole('button', { name: 'Create skill' }))
    await user.type(screen.getByLabelText('Skill name'), ' SQL ')
    await user.click(screen.getByRole('button', { name: 'Save skill' }))

    await waitFor(() => expect(mocks.createSkill).toHaveBeenCalledWith({ name: 'SQL' }))
    expect(screen.getByText('SQL')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Created skill SQL.')
  })

  it('renames a catalog skill and updates its display', async () => {
    mocks.updateSkill.mockResolvedValue({ id: 1, name: 'Python 3' })
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.click(within(catalogItem('Python')).getByRole('button', { name: 'Rename' }))
    const input = screen.getByLabelText('Rename skill')
    await user.clear(input)
    await user.type(input, 'Python 3')
    await user.click(screen.getByRole('button', { name: 'Save skill' }))

    await waitFor(() => expect(mocks.updateSkill).toHaveBeenCalledWith(1, { name: 'Python 3' }))
    expect(screen.getByText('Python 3')).toBeInTheDocument()
  })

  it('deletes a catalog skill after confirmation', async () => {
    mocks.deleteSkill.mockResolvedValue(undefined)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.click(within(catalogItem('Python')).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(mocks.deleteSkill).toHaveBeenCalledWith(1))
    expect(screen.queryByText('Python')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Deleted skill Python.')
    confirm.mockRestore()
  })

  it('shows a friendly duplicate-name conflict', async () => {
    mocks.createSkill.mockRejectedValue(new ApiError(409))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.click(screen.getByRole('button', { name: 'Create skill' }))
    await user.type(screen.getByLabelText('Skill name'), 'Python')
    await user.click(screen.getByRole('button', { name: 'Save skill' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('A skill with this name already exists.')
    expect(screen.queryByText('API request failed')).not.toBeInTheDocument()
  })

  it('loads, assigns, updates, and removes employee skills', async () => {
    mocks.createEmployeeSkill.mockResolvedValue({ skill_id: 2, skill_name: 'React', level: 'INTERMEDIATE' })
    mocks.updateEmployeeSkill.mockResolvedValue({ skill_id: 1, skill_name: 'Python', level: 'EXPERT' })
    mocks.deleteEmployeeSkill.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.selectOptions(screen.getByLabelText('Employee'), '10')
    await waitFor(() => expect(mocks.getEmployeeSkills).toHaveBeenCalledWith(10))
    expect(await screen.findByLabelText('Change Python level')).toHaveValue('ADVANCED')

    await user.selectOptions(screen.getByLabelText('Assign skill'), '2')
    await user.selectOptions(screen.getByLabelText('Level'), 'INTERMEDIATE')
    await user.click(screen.getByRole('button', { name: 'Add skill' }))
    await waitFor(() => expect(mocks.createEmployeeSkill).toHaveBeenCalledWith(10, { skill_id: 2, level: 'INTERMEDIATE' }))

    await user.selectOptions(screen.getByLabelText('Change Python level'), 'EXPERT')
    await waitFor(() => expect(mocks.updateEmployeeSkill).toHaveBeenCalledWith(10, 1, { level: 'EXPERT' }))

    const reactRow = screen.getByLabelText('Change React level').closest('li')
    if (!reactRow) throw new Error('React employee skill row not found')
    await user.click(within(reactRow).getByRole('button', { name: 'Remove skill' }))
    await waitFor(() => expect(mocks.deleteEmployeeSkill).toHaveBeenCalledWith(10, 2))
  })

  it('loads, creates, updates, and removes project requirements', async () => {
    mocks.createProjectSkill.mockResolvedValue({ skill_id: 1, skill_name: 'Python', required_level: 'ADVANCED' })
    mocks.updateProjectSkill.mockResolvedValue({ skill_id: 2, skill_name: 'React', required_level: 'EXPERT' })
    mocks.deleteProjectSkill.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Python')

    await user.selectOptions(screen.getByLabelText('Project'), '20')
    await waitFor(() => expect(mocks.getProjectSkills).toHaveBeenCalledWith(20))
    expect(await screen.findByLabelText('Change required React level')).toHaveValue('INTERMEDIATE')

    await user.selectOptions(screen.getByLabelText('Add requirement'), '1')
    await user.selectOptions(screen.getByLabelText('Required level'), 'ADVANCED')
    await user.click(screen.getByRole('button', { name: 'Add requirement' }))
    await waitFor(() => expect(mocks.createProjectSkill).toHaveBeenCalledWith(20, { skill_id: 1, required_level: 'ADVANCED' }))

    await user.selectOptions(screen.getByLabelText('Change required React level'), 'EXPERT')
    await waitFor(() => expect(mocks.updateProjectSkill).toHaveBeenCalledWith(20, 2, { required_level: 'EXPERT' }))

    const pythonRow = screen.getByLabelText('Change required Python level').closest('li')
    if (!pythonRow) throw new Error('Python project skill row not found')
    await user.click(within(pythonRow).getByRole('button', { name: 'Remove requirement' }))
    await waitFor(() => expect(mocks.deleteProjectSkill).toHaveBeenCalledWith(20, 1))
  })

  it.each<UserRole>(['ADMIN', 'MANAGER'])('%s users see write controls', async (role) => {
    renderPage(role)
    await screen.findByText('Python')
    expect(screen.getByRole('button', { name: 'Create skill' })).toBeInTheDocument()
    expect(within(catalogItem('Python')).getByRole('button', { name: 'Rename' })).toBeInTheDocument()
  })

  it('keeps the page read-only for EMPLOYEE users', async () => {
    const user = userEvent.setup()
    renderPage('EMPLOYEE')
    await screen.findByText('Python')

    expect(screen.queryByRole('button', { name: 'Create skill' })).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Employee'), '10')
    await user.selectOptions(screen.getByLabelText('Project'), '20')

    expect(await screen.findByText('Advanced')).toBeInTheDocument()
    expect(await screen.findByText('Intermediate')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add requirement' })).not.toBeInTheDocument()
  })

  it('keeps independent sections usable and retries failed catalog data', async () => {
    mocks.getSkills.mockRejectedValueOnce(new Error('raw catalog failure')).mockResolvedValueOnce(skills)
    mocks.getEmployees.mockRejectedValue(new Error('raw employee failure'))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('The skill catalog could not be loaded.')).toBeInTheDocument()
    expect(screen.getByText('Employees could not be loaded.')).toBeInTheDocument()
    expect(screen.getByLabelText('Project')).toBeEnabled()
    expect(screen.queryByText('raw catalog failure')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Python')).toBeInTheDocument()
    expect(mocks.getSkills).toHaveBeenCalledTimes(2)
  })
})
