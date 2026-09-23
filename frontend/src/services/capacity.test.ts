import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedRequest } from './api'
import { getEmployeeCapacities } from './capacity'

vi.mock('./api', () => ({ authenticatedRequest: vi.fn() }))

const requestMock = vi.mocked(authenticatedRequest)

describe('capacity service', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue([])
  })

  it('loads the employee capacity overview without a date', async () => {
    await getEmployeeCapacities()

    expect(requestMock).toHaveBeenCalledWith('/capacity/employees')
  })

  it('adds an explicit date query parameter', async () => {
    await getEmployeeCapacities('2026-10-15')

    expect(requestMock).toHaveBeenCalledWith('/capacity/employees?date=2026-10-15')
  })
})
