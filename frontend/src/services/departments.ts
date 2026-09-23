import { authenticatedRequest } from './api'
import type { Department, DepartmentCreate, DepartmentUpdate } from '@/types/department'

export function getDepartments(): Promise<Department[]> {
  return authenticatedRequest<Department[]>('/departments')
}

export function createDepartment(department: DepartmentCreate): Promise<Department> {
  return authenticatedRequest<Department>('/departments', {
    method: 'POST',
    body: JSON.stringify(department),
  })
}

export function updateDepartment(
  departmentId: number,
  department: DepartmentUpdate,
): Promise<Department> {
  return authenticatedRequest<Department>(`/departments/${departmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(department),
  })
}

export function deleteDepartment(departmentId: number): Promise<void> {
  return authenticatedRequest<void>(`/departments/${departmentId}`, { method: 'DELETE' })
}
