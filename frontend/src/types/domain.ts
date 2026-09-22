export type ProjectStatus = 'On track' | 'At risk' | 'Planning'
export type ActivityCategory = 'People' | 'Delivery' | 'Organization'
export type DepartmentName = 'Engineering' | 'Product' | 'Sales' | 'Finance' | 'People' | 'Operations'
export type ProjectName =
  | 'Atlas Platform'
  | 'Customer Portal'
  | 'Market Expansion'
  | 'Workforce Planning'
  | 'Cost Controls 2027'
export type DashboardStatisticId = 'employees' | 'departments' | 'projects' | 'assigned'
export type AllocationSummaryId = 'assigned' | 'available' | 'leave'
export type OperationalActivityId =
  | 'customerPortalRisk'
  | 'engineeringHires'
  | 'financeReporting'
  | 'atlasMilestone'
export type ActivityTimeId = 'today0940' | 'yesterday1510' | 'sep191125' | 'sep181645'

export interface Department {
  id: number
  name: DepartmentName
  lead: string
  employeeCount: number
  location: string
  activeProjects: number
  allocationPercent: number
}

export interface Project {
  id: number
  name: ProjectName
  department: DepartmentName
  owner: string
  status: ProjectStatus
  progress: number
  teamSize: number
  dueDate: string
}

export interface DashboardStatistic {
  id: DashboardStatisticId
  value: number
}

export interface AllocationSummary {
  id: AllocationSummaryId
  employeeCount: number
  percentage: number
}

export interface OperationalActivity {
  id: number
  category: ActivityCategory
  activityId: OperationalActivityId
  occurredAt: ActivityTimeId
}
