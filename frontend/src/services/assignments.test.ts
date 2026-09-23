import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AssignmentCreate, AssignmentUpdate } from '@/types/assignment'
import { authenticatedRequest } from './api'
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from './assignments'

vi.mock('./api', () => ({ authenticatedRequest: vi.fn() }))

const requestMock = vi.mocked(authenticatedRequest)

describe('assignments service', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('lists assignments through the authenticated endpoint', async () => {
    requestMock.mockResolvedValueOnce([])

    await getAssignments()

    expect(requestMock).toHaveBeenCalledWith('/assignments')
  })

  it('creates an assignment with the expected POST contract', async () => {
    const payload: AssignmentCreate = {
      employee_id: 1,
      project_id: 2,
      allocation_percent: 50,
      start_date: '2026-10-01',
      end_date: null,
    }
    requestMock.mockResolvedValueOnce({})

    await createAssignment(payload)

    expect(requestMock).toHaveBeenCalledWith('/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('updates an assignment with the expected PATCH contract', async () => {
    const payload: AssignmentUpdate = { allocation_percent: 75, end_date: null }
    requestMock.mockResolvedValueOnce({})

    await updateAssignment(17, payload)

    expect(requestMock).toHaveBeenCalledWith('/assignments/17', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  })

  it('deletes an assignment with the expected DELETE contract', async () => {
    requestMock.mockResolvedValueOnce(undefined)

    await deleteAssignment(17)

    expect(requestMock).toHaveBeenCalledWith('/assignments/17', { method: 'DELETE' })
  })
})
