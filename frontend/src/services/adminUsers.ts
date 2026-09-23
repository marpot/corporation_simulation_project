import type {
  AdminUser,
  AdminUserCreate,
  AdminUserPasswordUpdate,
  AdminUserUpdate,
} from '@/types/adminUser'
import { authenticatedRequest } from './api'

const ADMIN_USERS_PATH = '/admin/users'

export function getAdminUsers(): Promise<AdminUser[]> {
  return authenticatedRequest<AdminUser[]>(ADMIN_USERS_PATH)
}

export function createAdminUser(user: AdminUserCreate): Promise<AdminUser> {
  return authenticatedRequest<AdminUser>(ADMIN_USERS_PATH, {
    method: 'POST',
    body: JSON.stringify(user),
  })
}

export function updateAdminUser(userId: number, user: AdminUserUpdate): Promise<AdminUser> {
  return authenticatedRequest<AdminUser>(`${ADMIN_USERS_PATH}/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(user),
  })
}

export function changeAdminUserPassword(
  userId: number,
  password: AdminUserPasswordUpdate,
): Promise<AdminUser> {
  return authenticatedRequest<AdminUser>(`${ADMIN_USERS_PATH}/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify(password),
  })
}
