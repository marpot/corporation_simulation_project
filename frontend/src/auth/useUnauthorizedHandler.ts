import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/services/api'
import { useAuth } from './useAuth'

export function useUnauthorizedHandler() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      void navigate('/login', { replace: true })
      return true
    }
    return false
  }, [logout, navigate])
}
