import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  EmployeeSkillCreate,
  EmployeeSkillUpdate,
  ProjectSkillCreate,
  ProjectSkillUpdate,
  SkillCreate,
  SkillUpdate,
} from '@/types/skill'
import { authenticatedRequest } from './api'
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
} from './skills'

vi.mock('./api', () => ({ authenticatedRequest: vi.fn() }))

const requestMock = vi.mocked(authenticatedRequest)

describe('skills service', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('uses the skill catalog endpoints', async () => {
    const createPayload: SkillCreate = { name: 'TypeScript' }
    const updatePayload: SkillUpdate = { name: 'Advanced TypeScript' }
    requestMock.mockResolvedValue(undefined)

    await getSkills()
    await createSkill(createPayload)
    await updateSkill(7, updatePayload)
    await deleteSkill(7)

    expect(requestMock).toHaveBeenNthCalledWith(1, '/skills')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/skills', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/skills/7', {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(4, '/skills/7', { method: 'DELETE' })
  })

  it('uses the nested employee skill endpoints', async () => {
    const createPayload: EmployeeSkillCreate = { skill_id: 7, level: 'ADVANCED' }
    const updatePayload: EmployeeSkillUpdate = { level: 'EXPERT' }
    requestMock.mockResolvedValue(undefined)

    await getEmployeeSkills(3)
    await createEmployeeSkill(3, createPayload)
    await updateEmployeeSkill(3, 7, updatePayload)
    await deleteEmployeeSkill(3, 7)

    expect(requestMock).toHaveBeenNthCalledWith(1, '/employees/3/skills')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/employees/3/skills', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/employees/3/skills/7', {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(4, '/employees/3/skills/7', {
      method: 'DELETE',
    })
  })

  it('uses the nested project requirement endpoints', async () => {
    const createPayload: ProjectSkillCreate = {
      skill_id: 7,
      required_level: 'INTERMEDIATE',
    }
    const updatePayload: ProjectSkillUpdate = { required_level: 'ADVANCED' }
    requestMock.mockResolvedValue(undefined)

    await getProjectSkills(11)
    await createProjectSkill(11, createPayload)
    await updateProjectSkill(11, 7, updatePayload)
    await deleteProjectSkill(11, 7)

    expect(requestMock).toHaveBeenNthCalledWith(1, '/projects/11/skills')
    expect(requestMock).toHaveBeenNthCalledWith(2, '/projects/11/skills', {
      method: 'POST',
      body: JSON.stringify(createPayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(3, '/projects/11/skills/7', {
      method: 'PATCH',
      body: JSON.stringify(updatePayload),
    })
    expect(requestMock).toHaveBeenNthCalledWith(4, '/projects/11/skills/7', {
      method: 'DELETE',
    })
  })
})
