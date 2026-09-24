import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authenticatedRequest } from './api'
import { getProjectMatches } from './matching'

vi.mock('./api', () => ({ authenticatedRequest: vi.fn() }))

const requestMock = vi.mocked(authenticatedRequest)

describe('matching service', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue([])
  })

  it('requests project matching without a date when none is selected', async () => {
    await getProjectMatches(12)

    expect(requestMock).toHaveBeenCalledWith('/projects/12/matching')
  })

  it('adds the selected target date to the matching request', async () => {
    await getProjectMatches(12, '2026-10-15')

    expect(requestMock).toHaveBeenCalledWith('/projects/12/matching?date=2026-10-15')
  })
})
