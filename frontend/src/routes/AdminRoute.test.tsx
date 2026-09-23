import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/auth-context'
import type { User, UserRole } from '../types/auth'
import { AdminRoute } from './AdminRoute'

function renderAdminRoute(user: User | null) {
  const authValue: AuthContextValue = {
    user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<h1>Protected administration</h1>} />
          </Route>
          <Route path="login" element={<h1>Sign in</h1>} />
          <Route path="/" element={<h1>Business application</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function userWithRole(role: UserRole): User {
  return {
    id: 1,
    email: `${role.toLowerCase()}@example.com`,
    role,
    is_active: true,
  }
}

describe('AdminRoute', () => {
  it('redirects unauthenticated users to login', () => {
    renderAdminRoute(null)

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it.each<UserRole>(['MANAGER', 'EMPLOYEE'])('redirects %s users to the business application', (role) => {
    renderAdminRoute(userWithRole(role))

    expect(screen.getByRole('heading', { name: 'Business application' })).toBeInTheDocument()
  })

  it('allows an ADMIN to access the nested route', () => {
    renderAdminRoute(userWithRole('ADMIN'))

    expect(screen.getByRole('heading', { name: 'Protected administration' })).toBeInTheDocument()
  })
})
