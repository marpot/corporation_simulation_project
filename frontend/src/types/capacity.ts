export type CapacityStatus = 'AVAILABLE' | 'FULLY_ALLOCATED' | 'OVERALLOCATED'

export interface EmployeeCapacity {
  employee_id: number
  employee_name: string
  allocated_percent: number
  available_percent: number
  status: CapacityStatus
}
