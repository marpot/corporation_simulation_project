import { beforeEach, describe, expect, it, vi } from 'vitest'
import { removeStoredAccessToken, storeAccessToken } from './auth'
import { ApiError, authenticatedRequest } from './api'

const fetchMock = vi.fn<typeof fetch>()

describe('authenticatedRequest', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    removeStoredAccessToken()
  })

  it('rejects with 401 without making a request when no access token is stored', async () => {
    await expect(authenticatedRequest('/projects')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'API request failed',
      status: 401,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('adds bearer authentication and returns the parsed JSON response', async () => {
    storeAccessToken('access-token')
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 7, name: 'Atlas' })))

    const result = await authenticatedRequest<{ id: number; name: string }>('/projects/7')

    expect(result).toEqual({ id: 7, name: 'Atlas' })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/projects/7')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer access-token')
  })

  it('sets JSON content type for request bodies while preserving custom headers', async () => {
    storeAccessToken('access-token')
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 8 }), { status: 201 }))

    await authenticatedRequest('/projects', {
      method: 'POST',
      headers: { 'X-Request-Id': 'request-7' },
      body: JSON.stringify({ name: 'New project' }),
    })

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ name: 'New project' }))
    expect(headers.get('Authorization')).toBe('Bearer access-token')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Request-Id')).toBe('request-7')
  })

  it('does not overwrite an explicitly supplied content type', async () => {
    storeAccessToken('access-token')
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ accepted: true })))

    await authenticatedRequest('/imports', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'plain text',
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init?.headers).get('Content-Type')).toBe('text/plain')
  })

  it('returns undefined for a successful no-content response', async () => {
    storeAccessToken('access-token')
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(authenticatedRequest('/projects/7', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying the response status for failed requests', async () => {
    storeAccessToken('access-token')
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }))

    const request = authenticatedRequest('/admin/users')

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({ status: 403 })
  })
})
