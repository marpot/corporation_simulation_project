import type { Token, User } from '@/types/auth'

const ACCESS_TOKEN_STORAGE_KEY = 'corp-ops-access-token'
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

export class AuthApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super('Authentication request failed')
    this.name = 'AuthApiError'
    this.status = status
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new AuthApiError(response.status)
  return response.json() as Promise<T>
}

export async function requestAccessToken(email: string, password: string): Promise<Token> {
  const credentials = new URLSearchParams({
    username: email,
    password,
  })

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: credentials,
  })

  return parseResponse<Token>(response)
}

export async function requestCurrentUser(accessToken: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  return parseResponse<User>(response)
}

export function getStoredAccessToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeAccessToken(accessToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
}

export function removeStoredAccessToken(): void {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    // In-memory authentication state is still cleared if storage is unavailable.
  }
}
