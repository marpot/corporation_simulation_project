export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE'

export interface Token {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  email: string
  role: UserRole
  is_active: boolean
}
