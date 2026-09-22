import { getStoredAccessToken } from './auth'
import type { Employee, EmployeeCreate, EmployeeUpdate } from '../types/employee'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

export class EmployeeApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super('Employee request failed')
    this.name = 'EmployeeApiError'
    this.status = status
  }
}

async function authenticatedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = getStoredAccessToken()
  if (!accessToken) throw new EmployeeApiError(401)

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (!response.ok) throw new EmployeeApiError(response.status)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function getEmployees(): Promise<Employee[]> {
  return authenticatedRequest<Employee[]>('/employees')
}

export function createEmployee(employee: EmployeeCreate): Promise<Employee> {
  return authenticatedRequest<Employee>('/employees', {
    method: 'POST',
    body: JSON.stringify(employee),
  })
}

export function updateEmployee(employeeId: number, employee: EmployeeUpdate): Promise<Employee> {
  return authenticatedRequest<Employee>(`/employees/${employeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(employee),
  })
}

export function deleteEmployee(employeeId: number): Promise<void> {
  return authenticatedRequest<void>(`/employees/${employeeId}`, { method: 'DELETE' })
}
