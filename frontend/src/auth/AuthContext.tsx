import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  getStoredAccessToken,
  removeStoredAccessToken,
  requestAccessToken,
  requestCurrentUser,
  storeAccessToken,
} from '../services/auth'
import type { User } from '../types/auth'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [initialAccessToken] = useState(getStoredAccessToken)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(initialAccessToken))

  useEffect(() => {
    let isCurrent = true

    if (!initialAccessToken) {
      return () => {
        isCurrent = false
      }
    }

    requestCurrentUser(initialAccessToken)
      .then((currentUser) => {
        if (isCurrent) setUser(currentUser)
      })
      .catch(() => {
        removeStoredAccessToken()
        if (isCurrent) setUser(null)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [initialAccessToken])

  const login = useCallback(async (email: string, password: string) => {
    const token = await requestAccessToken(email, password)
    storeAccessToken(token.access_token)

    try {
      const currentUser = await requestCurrentUser(token.access_token)
      setUser(currentUser)
    } catch (error) {
      removeStoredAccessToken()
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    removeStoredAccessToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
