import { authenticatedRequest } from './api'
import type { EmployeeCapacity } from '@/types/capacity'

export function getEmployeeCapacities(date?: string): Promise<EmployeeCapacity[]> {
  const query = date ? `?${new URLSearchParams({ date }).toString()}` : ''
  return authenticatedRequest<EmployeeCapacity[]>(`/capacity/employees${query}`)
}
