export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED'

export interface Project {
  id: number
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string
  end_date: string | null
  active: boolean
}

export interface ProjectCreate {
  name: string
  description?: string | null
  status: ProjectStatus
  start_date: string
  end_date?: string | null
  active: boolean
}

export type ProjectUpdate = Partial<ProjectCreate>
