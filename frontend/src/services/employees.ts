import { authenticatedRequest } from './api'
import type { Employee, EmployeeCreate, EmployeeUpdate } from '@/types/employee'

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
