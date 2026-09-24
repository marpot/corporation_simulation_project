import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/auth/auth-context'
import { LanguageContext, type LanguageContextValue } from '@/i18n/language-context'
import { translations } from '@/i18n/translations'
import { ApiError } from '@/services/api'
import { getProjectMatches } from '@/services/matching'
import { getProjects } from '@/services/projects'
import type { User } from '@/types/auth'
import type { EmployeeProjectMatch } from '@/types/matching'
import type { Project } from '@/types/project'
import { MatchingPage } from './MatchingPage'

vi.mock('@/services/matching', () => ({ getProjectMatches: vi.fn() }))
vi.mock('@/services/projects', () => ({ getProjects: vi.fn() }))

const getProjectMatchesMock = vi.mocked(getProjectMatches)
const getProjectsMock = vi.mocked(getProjects)

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
    id: 20,
    name: 'Portal',
    description: null,
    status: 'PLANNED',
    start_date: '2026-11-01',
    end_date: null,
    active: true,
  },
]

const matches: EmployeeProjectMatch[] = [
  {
    employee_id: 8,
    employee_name: 'Zoe Zielinska',
    requirements_met: 1,
    requirements_total: 3,
    matched_requirements: [{
      skill_id: 1,
      skill_name: 'Python',
      required_level: 'INTERMEDIATE',
      employee_level: 'ADVANCED',
      met: true,
    }],
    unmet_requirements: [
      {
        skill_id: 2,
        skill_name: 'React',
        required_level: 'ADVANCED',
        employee_level: 'BEGINNER',
        met: false,
      },
      {
        skill_id: 3,
        skill_name: 'SQL',
        required_level: 'BEGINNER',
        employee_level: null,
        met: false,
      },
    ],
    allocated_percent: 70,
    available_percent: 30,
    capacity_status: 'AVAILABLE',
  },
  {
    employee_id: 2,
    employee_name: 'Anna Adams',
    requirements_met: 3,
    requirements_total: 3,
    matched_requirements: [],
    unmet_requirements: [],
    allocated_percent: 100,
    available_percent: 0,
    capacity_status: 'FULLY_ALLOCATED',
  },
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
        <MemoryRouter initialEntries={['/matching']}>
          <Routes>
            <Route path="/matching" element={<MatchingPage />} />
            <Route path="/login" element={<div>Login destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </LanguageContext.Provider>,
  )

  return { logout }
}

async function selectAtlas() {
  const user = userEvent.setup()
  await user.selectOptions(await screen.findByLabelText('Project'), '10')
  return user
}

describe('MatchingPage', () => {
  beforeEach(() => {
    getProjectsMock.mockReset()
    getProjectMatchesMock.mockReset()
    getProjectsMock.mockResolvedValue(projects)
    getProjectMatchesMock.mockResolvedValue(matches)
  })

  it('offers projects for selection and loads matches for the selected project', async () => {
    renderPage()

    const projectSelect = await screen.findByLabelText('Project')
    expect(within(projectSelect).getByRole('option', { name: 'Atlas' })).toBeInTheDocument()
    expect(within(projectSelect).getByRole('option', { name: 'Portal' })).toBeInTheDocument()

    await selectAtlas()

    await waitFor(() => expect(getProjectMatchesMock).toHaveBeenCalledWith(10, undefined))
  })

  it('preserves API order and explains requirements and capacity', async () => {
    renderPage()
    await selectAtlas()

    const candidates = await screen.findAllByTestId('matching-candidate')
    expect(candidates).toHaveLength(2)
    expect(within(candidates[0]).getByRole('heading', { name: 'Zoe Zielinska' })).toBeInTheDocument()
    expect(within(candidates[1]).getByRole('heading', { name: 'Anna Adams' })).toBeInTheDocument()

    const firstCandidate = within(candidates[0])
    expect(firstCandidate.getByText('1 / 3')).toBeInTheDocument()
    expect(firstCandidate.getByText('Python')).toBeInTheDocument()
    expect(firstCandidate.getByText('Employee: Advanced')).toBeInTheDocument()
    expect(firstCandidate.getByText('React')).toBeInTheDocument()
    expect(firstCandidate.getByText('Employee: Beginner')).toBeInTheDocument()
    expect(firstCandidate.getByText('SQL')).toBeInTheDocument()
    expect(firstCandidate.getByText('Employee skill: Missing')).toBeInTheDocument()
    expect(firstCandidate.getAllByText('Not satisfied')).toHaveLength(2)
    expect(firstCandidate.getByText('70%')).toBeInTheDocument()
    expect(firstCandidate.getByText('30%')).toBeInTheDocument()
    expect(firstCandidate.getAllByText('Available')).toHaveLength(2)
  })

  it('sends the selected target date without changing the result order', async () => {
    renderPage()
    const user = await selectAtlas()
    await screen.findAllByTestId('matching-candidate')

    await user.type(screen.getByLabelText('Target date'), '2026-10-15')

    await waitFor(() => {
      expect(getProjectMatchesMock).toHaveBeenLastCalledWith(10, '2026-10-15')
    })
    const candidates = await screen.findAllByTestId('matching-candidate')
    expect(within(candidates[0]).getByText('Zoe Zielinska')).toBeInTheDocument()
  })

  it('explains the capacity-based ordering for a project without requirements', async () => {
    getProjectMatchesMock.mockResolvedValue([{ ...matches[0], requirements_met: 0, requirements_total: 0, matched_requirements: [], unmet_requirements: [] }])
    renderPage()

    await selectAtlas()

    expect(await screen.findByRole('note')).toHaveTextContent('No skill requirements configured')
    expect(screen.getByRole('note')).toHaveTextContent('based on available capacity')
  })

  it('shows a useful empty state when there are no candidates', async () => {
    getProjectMatchesMock.mockResolvedValue([])
    renderPage()

    await selectAtlas()

    expect(await screen.findByText('No active employee candidates')).toBeInTheDocument()
    expect(screen.getByText('There are no active employees available for matching.')).toBeInTheDocument()
  })

  it('shows a friendly matching API error without raw details', async () => {
    getProjectMatchesMock.mockRejectedValue(new Error('database connection details'))
    renderPage()

    await selectAtlas()

    expect(await screen.findByRole('alert')).toHaveTextContent('Project matching could not be loaded')
    expect(screen.queryByText('database connection details')).not.toBeInTheDocument()
  })

  it('uses the shared unauthorized handler for a 401 response', async () => {
    getProjectMatchesMock.mockRejectedValue(new ApiError(401))
    const { logout } = renderPage()

    await selectAtlas()

    await waitFor(() => expect(logout).toHaveBeenCalledOnce())
    expect(await screen.findByText('Login destination')).toBeInTheDocument()
  })
})
