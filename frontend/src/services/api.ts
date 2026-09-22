import { API_BASE_URL, getStoredAccessToken } from './auth'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super('API request failed')
    this.name = 'ApiError'
    this.status = status
  }
}

export async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = getStoredAccessToken()
  if (!accessToken) throw new ApiError(401)

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) throw new ApiError(response.status)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
