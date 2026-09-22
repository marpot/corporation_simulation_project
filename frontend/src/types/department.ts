export interface Department {
  id: number
  name: string
  description: string | null
  active: boolean
}

export interface DepartmentCreate {
  name: string
  description?: string | null
  active: boolean
}

export type DepartmentUpdate = Partial<DepartmentCreate>
