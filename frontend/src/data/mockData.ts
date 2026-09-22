import type {
  DashboardStatistic,
  Department,
  Employee,
  AllocationSummary,
  OperationalActivity,
  Project,
} from '../types/domain'

export const dashboardStatistics: DashboardStatistic[] = [
  { id: 'employees', value: 248 },
  { id: 'departments', value: 8 },
  { id: 'projects', value: 14 },
  { id: 'assigned', value: 79 },
]

export const employees: Employee[] = [
  { id: 1, name: 'Marta Kowalska', initials: 'MK', role: 'Senior Product Manager', department: 'Product', email: 'marta.kowalska@example.com', status: 'Active', currentProject: 'Customer Portal', allocationPercent: 90 },
  { id: 2, name: 'Tomasz Zieliński', initials: 'TZ', role: 'Backend Engineer', department: 'Engineering', email: 'tomasz.zielinski@example.com', status: 'Active', currentProject: 'Atlas Platform', allocationPercent: 100 },
  { id: 3, name: 'Aleksandra Nowak', initials: 'AN', role: 'People Operations Lead', department: 'People', email: 'aleksandra.nowak@example.com', status: 'On leave', currentProject: null, allocationPercent: 0 },
  { id: 4, name: 'Piotr Wiśniewski', initials: 'PW', role: 'Financial Analyst', department: 'Finance', email: 'piotr.wisniewski@example.com', status: 'Active', currentProject: 'Cost Controls 2027', allocationPercent: 65 },
  { id: 5, name: 'Julia Kamińska', initials: 'JK', role: 'Account Director', department: 'Sales', email: 'julia.kaminska@example.com', status: 'Active', currentProject: 'Market Expansion', allocationPercent: 80 },
]

export const departments: Department[] = [
  { id: 1, name: 'Engineering', lead: 'Anna Wójcik', employeeCount: 74, location: 'Warsaw', activeProjects: 5, allocationPercent: 86 },
  { id: 2, name: 'Product', lead: 'Marta Kowalska', employeeCount: 31, location: 'Warsaw', activeProjects: 3, allocationPercent: 81 },
  { id: 3, name: 'Sales', lead: 'Julia Kamińska', employeeCount: 48, location: 'Kraków', activeProjects: 2, allocationPercent: 76 },
  { id: 4, name: 'Finance', lead: 'Michał Mazur', employeeCount: 22, location: 'Warsaw', activeProjects: 1, allocationPercent: 68 },
  { id: 5, name: 'People', lead: 'Aleksandra Nowak', employeeCount: 16, location: 'Gdańsk', activeProjects: 1, allocationPercent: 62 },
  { id: 6, name: 'Operations', lead: 'Kamil Lewandowski', employeeCount: 39, location: 'Poznań', activeProjects: 2, allocationPercent: 73 },
]

export const projects: Project[] = [
  { id: 1, name: 'Atlas Platform', department: 'Engineering', owner: 'Tomasz Zieliński', status: 'On track', progress: 72, teamSize: 18, dueDate: '2026-12-18' },
  { id: 2, name: 'Customer Portal', department: 'Product', owner: 'Marta Kowalska', status: 'At risk', progress: 48, teamSize: 12, dueDate: '2026-11-30' },
  { id: 3, name: 'Market Expansion', department: 'Sales', owner: 'Julia Kamińska', status: 'On track', progress: 61, teamSize: 9, dueDate: '2027-01-20' },
  { id: 4, name: 'Workforce Planning', department: 'People', owner: 'Aleksandra Nowak', status: 'Planning', progress: 24, teamSize: 6, dueDate: '2027-03-12' },
]

export const allocationSummary: AllocationSummary[] = [
  { id: 'assigned', employeeCount: 196, percentage: 79 },
  { id: 'available', employeeCount: 34, percentage: 14 },
  { id: 'leave', employeeCount: 18, percentage: 7 },
]

export const operationalActivities: OperationalActivity[] = [
  { id: 1, category: 'Delivery', activityId: 'customerPortalRisk', occurredAt: 'today0940' },
  { id: 2, category: 'People', activityId: 'engineeringHires', occurredAt: 'yesterday1510' },
  { id: 3, category: 'Organization', activityId: 'financeReporting', occurredAt: 'sep191125' },
  { id: 4, category: 'Delivery', activityId: 'atlasMilestone', occurredAt: 'sep181645' },
]
