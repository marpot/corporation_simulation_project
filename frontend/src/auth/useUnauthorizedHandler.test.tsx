import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/services/api'
import { AuthContext, type AuthContextValue } from './auth-context'
import { useUnauthorizedHandler } from './useUnauthorizedHandler'

const navigate = vi.fn()
const logout = vi.fn()

vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))

const authValue: AuthContextValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout,
}

function Wrapper({ children }: PropsWithChildren) {
  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
}

describe('useUnauthorizedHandler', () => {
  beforeEach(() => {
    navigate.mockReset()
    logout.mockReset()
  })

  it('logs out and replaces the current route for a 401 API error', () => {
    const { result } = renderHook(() => useUnauthorizedHandler(), { wrapper: Wrapper })

    expect(result.current(new ApiError(401))).toBe(true)
    expect(logout).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('leaves non-401 errors for the caller to handle', () => {
    const { result } = renderHook(() => useUnauthorizedHandler(), { wrapper: Wrapper })

    expect(result.current(new ApiError(500))).toBe(false)
    expect(logout).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
