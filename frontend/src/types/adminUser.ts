import type { UserRole } from './auth'

export type AdminUserRole = UserRole

export interface AdminUser {
  id: number
  email: string
  role: AdminUserRole
  is_active: boolean
}

export interface AdminUserCreate {
  email: string
  password: string
  role: AdminUserRole
  is_active: boolean
}

export interface AdminUserUpdate {
  email?: string
  role?: AdminUserRole
  is_active?: boolean
}

export interface AdminUserPasswordUpdate {
  password: string
}
