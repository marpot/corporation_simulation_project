import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type {
  AdminUser,
  AdminUserCreate,
  AdminUserPasswordUpdate,
  AdminUserUpdate,
} from '@/types/adminUser'
import { authenticatedRequest } from './api'
import {
  changeAdminUserPassword,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
} from './adminUsers'

vi.mock('./api', () => ({ authenticatedRequest: vi.fn() }))

const requestMock = vi.mocked(authenticatedRequest)

describe('adminUsers service', () => {
  beforeEach(() => {
    requestMock.mockReset()
  })

  it('lists users through the admin endpoint', async () => {
    requestMock.mockResolvedValueOnce([])

    await getAdminUsers()

    expect(requestMock).toHaveBeenCalledWith('/admin/users')
  })

  it('creates a user with the expected POST contract', async () => {
    const payload: AdminUserCreate = {
      email: 'new@example.com',
      password: 'valid-pass',
      role: 'MANAGER',
      is_active: true,
    }
    requestMock.mockResolvedValueOnce({
      id: 4,
      email: payload.email,
      role: payload.role,
      is_active: payload.is_active,
    })

    await createAdminUser(payload)

    expect(requestMock).toHaveBeenCalledWith('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  })

  it('updates a user with the expected PATCH contract', async () => {
    const payload: AdminUserUpdate = { role: 'ADMIN', is_active: false }
    requestMock.mockResolvedValueOnce({})

    await updateAdminUser(17, payload)

    expect(requestMock).toHaveBeenCalledWith('/admin/users/17', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  })

  it('changes a password with the expected PUT contract', async () => {
    const payload: AdminUserPasswordUpdate = { password: 'new-valid-pass' }
    requestMock.mockResolvedValueOnce({})

    await changeAdminUserPassword(17, payload)

    expect(requestMock).toHaveBeenCalledWith('/admin/users/17/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  })

  it('models only the safe user response fields', () => {
    expectTypeOf<AdminUser>().toHaveProperty('id')
    expectTypeOf<AdminUser>().toHaveProperty('email')
    expectTypeOf<AdminUser>().toHaveProperty('role')
    expectTypeOf<AdminUser>().toHaveProperty('is_active')
    expectTypeOf<AdminUser>().not.toHaveProperty('password')
    expectTypeOf<AdminUser>().not.toHaveProperty('password_hash')
  })
})
