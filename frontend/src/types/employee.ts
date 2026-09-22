export type Seniority = 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD'

export interface Employee {
  id: number
  first_name: string
  last_name: string
  position: string
  seniority: Seniority
  weekly_capacity: number
  active: boolean
  user_id: number | null
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  position: string
  seniority: Seniority
  weekly_capacity: number
  active: boolean
  user_id?: number | null
}

export type EmployeeUpdate = Partial<EmployeeCreate>
