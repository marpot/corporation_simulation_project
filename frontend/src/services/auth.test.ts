import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Token, User } from '@/types/auth'
import {
  AuthApiError,
  getStoredAccessToken,
  removeStoredAccessToken,
  requestAccessToken,
  requestCurrentUser,
  storeAccessToken,
} from './auth'

const fetchMock = vi.fn<typeof fetch>()

describe('auth service', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests an access token with form-encoded credentials', async () => {
    const token: Token = { access_token: 'access-token', token_type: 'bearer' }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(token)))

    await expect(requestAccessToken('user+test@example.com', 'pass word')).resolves.toEqual(token)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/auth/login')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' })
    const body = init?.body
    expect(body).toBeInstanceOf(URLSearchParams)
    if (!(body instanceof URLSearchParams)) throw new Error('Expected form-encoded credentials')
    expect(body.toString()).toBe(
      'username=user%2Btest%40example.com&password=pass+word',
    )
  })

  it('reports the response status when authentication fails', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))

    const request = requestAccessToken('user@example.com', 'wrong-password')

    await expect(request).rejects.toBeInstanceOf(AuthApiError)
    await expect(request).rejects.toMatchObject({
      name: 'AuthApiError',
      message: 'Authentication request failed',
      status: 401,
    })
  })

  it('requests the current user with bearer authentication', async () => {
    const user: User = {
      id: 4,
      email: 'manager@example.com',
      role: 'MANAGER',
      is_active: true,
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(user)))

    await expect(requestCurrentUser('access-token')).resolves.toEqual(user)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/me', {
      headers: { Authorization: 'Bearer access-token' },
    })
  })

  it('reports current-user request failures with their response status', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 403 }))

    await expect(requestCurrentUser('expired-token')).rejects.toMatchObject({
      name: 'AuthApiError',
      status: 403,
    })
  })

  it('stores, reads, and removes the access token', () => {
    storeAccessToken('stored-token')
    expect(getStoredAccessToken()).toBe('stored-token')

    removeStoredAccessToken()
    expect(getStoredAccessToken()).toBeNull()
  })

  it('returns null when browser storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(getStoredAccessToken()).toBeNull()
  })

  it('does not throw when browser storage cannot remove the token', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable')
    })

    expect(() => removeStoredAccessToken()).not.toThrow()
  })
})
