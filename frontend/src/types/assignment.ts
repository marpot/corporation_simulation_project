export interface Assignment {
  id: number
  employee_id: number
  project_id: number
  allocation_percent: number
  start_date: string
  end_date: string | null
}

export interface AssignmentCreate {
  employee_id: number
  project_id: number
  allocation_percent: number
  start_date: string
  end_date?: string | null
}

export type AssignmentUpdate = Partial<AssignmentCreate>
