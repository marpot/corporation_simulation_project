import { useEffect, useState } from 'react'
import { useUnauthorizedHandler } from '@/auth/useUnauthorizedHandler'
import { StatCard } from '@/components/StatCard/StatCard'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, formatMessage } from '@/i18n/translations'
import { getAssignments } from '@/services/assignments'
import { getEmployeeCapacities } from '@/services/capacity'
import { getDepartments } from '@/services/departments'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import type { Assignment } from '@/types/assignment'
import type { CapacityStatus, EmployeeCapacity } from '@/types/capacity'
import type { Department } from '@/types/department'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import './DashboardPage.scss'

interface DashboardData {
  employees: Employee[]
  departments: Department[]
  projects: Project[]
  assignments: Assignment[]
  capacities: EmployeeCapacity[]
}

const capacityStatuses: CapacityStatus[] = [
  'AVAILABLE',
  'FULLY_ALLOCATED',
  'OVERALLOCATED',
]

function todayAsLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function projectStatusClass(status: Project['status']) {
  return status.toLowerCase().replace('_', '-')
}

function isActiveAssignment(assignment: Assignment, targetDate: string) {
  return assignment.start_date <= targetDate
    && (assignment.end_date === null || assignment.end_date >= targetDate)
}

export function DashboardPage() {
  const handleUnauthorized = useUnauthorizedHandler()
  const { language, t } = useLanguage()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      getEmployees(),
      getDepartments(),
      getProjects(),
      getAssignments(),
      getEmployeeCapacities(),
    ])
      .then(([employees, departments, projects, assignments, capacities]) => {
        if (isCurrent) setData({ employees, departments, projects, assignments, capacities })
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized, reloadKey])

  function retry() {
    setData(null)
    setLoadError(false)
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }

  if (isLoading) {
    return <div className="dashboard-page__state" role="status">{t.dashboard.loading}</div>
  }

  if (loadError || !data) {
    return (
      <div className="dashboard-page__state" role="alert">
        <strong>{t.dashboard.loadError}</strong>
        <span>{t.dashboard.loadErrorDescription}</span>
        <button type="button" onClick={retry}>{t.dashboard.retry}</button>
      </div>
    )
  }

  const targetDate = todayAsLocalDate()
  const activeAssignmentCount = data.assignments.filter((assignment) => (
    isActiveAssignment(assignment, targetDate)
  )).length
  const statistics = [
    { id: 'employees', value: data.employees.length },
    { id: 'departments', value: data.departments.length },
    { id: 'projects', value: data.projects.length },
    { id: 'assignments', value: activeAssignmentCount },
  ] as const
  const displayedProjects = data.projects.slice(0, 5)
  const departmentRows = data.departments.map((department) => {
    const employees = data.employees.filter((employee) => employee.department_id === department.id)
    return {
      ...department,
      employeeCount: employees.length,
      activeEmployeeCount: employees.filter((employee) => employee.active).length,
    }
  })
  const capacitySummary = capacityStatuses.map((status) => {
    const employeeCount = data.capacities.filter((capacity) => capacity.status === status).length
    const percentage = data.capacities.length === 0
      ? 0
      : Math.round((employeeCount / data.capacities.length) * 100)
    return { status, employeeCount, percentage }
  })

  return (
    <div className="page dashboard-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.dashboard.eyebrow}</p>
          <h2>{t.dashboard.title}</h2>
          <p>{t.dashboard.description}</p>
        </div>
      </section>

      <section className="dashboard-page__stats" aria-label={t.dashboard.statisticsLabel}>
        {statistics.map((statistic) => (
          <StatCard
            key={statistic.id}
            label={t.dashboard.metrics[statistic.id].label}
            value={statistic.value}
            detail={t.dashboard.metrics[statistic.id].detail}
          />
        ))}
      </section>

      <div className="dashboard-page__primary-grid">
        <section className="operations-panel operations-panel--projects">
          <div className="operations-panel__header">
            <div><h3>{t.dashboard.projectsOverview}</h3><p>{t.dashboard.projectsOverviewDescription}</p></div>
            <span>{formatMessage(t.dashboard.shown, { count: displayedProjects.length })}</span>
          </div>
          {displayedProjects.length === 0 ? (
            <div className="dashboard-page__empty"><strong>{t.dashboard.noProjects}</strong><span>{t.dashboard.noProjectsDescription}</span></div>
          ) : (
            <div className="table-scroll">
              <table>
                <thead><tr><th scope="col">{t.dashboard.project}</th><th scope="col">{t.dashboard.status}</th><th scope="col">{t.dashboard.startDate}</th><th scope="col">{t.dashboard.endDate}</th></tr></thead>
                <tbody>
                  {displayedProjects.map((project) => (
                    <tr key={project.id}>
                      <td><strong className="table-primary">{project.name}</strong></td>
                      <td><span className={`status status--${projectStatusClass(project.status)}`}>{t.projects.statuses[project.status]}</span></td>
                      <td>{formatDate(project.start_date, language)}</td>
                      <td>{project.end_date ? formatDate(project.end_date, language) : t.dashboard.noEndDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="operations-panel allocation-panel">
          <div className="operations-panel__header"><div><h3>{t.dashboard.capacitySummary}</h3><p>{t.dashboard.capacitySummaryDescription}</p></div></div>
          {data.capacities.length === 0 ? (
            <div className="dashboard-page__empty"><strong>{t.dashboard.noCapacity}</strong><span>{t.dashboard.noCapacityDescription}</span></div>
          ) : (
            <div className="allocation-list">
              {capacitySummary.map((item) => (
                <div className="allocation-list__item" key={item.status}>
                  <div><span>{t.capacity.statuses[item.status]}</span><strong>{item.employeeCount}</strong></div>
                  <progress value={item.percentage} max="100" aria-label={formatMessage(t.dashboard.capacityAria, { label: t.capacity.statuses[item.status], percentage: item.percentage })} />
                  <p>{item.percentage}% · {t.dashboard.capacityDetails[item.status]}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="operations-panel dashboard-page__departments">
        <div className="operations-panel__header"><div><h3>{t.dashboard.departmentOverview}</h3><p>{t.dashboard.departmentOverviewDescription}</p></div></div>
        {departmentRows.length === 0 ? (
          <div className="dashboard-page__empty"><strong>{t.dashboard.noDepartments}</strong><span>{t.dashboard.noDepartmentsDescription}</span></div>
        ) : (
          <div className="department-overview">
            <div className="department-overview__head"><span>{t.dashboard.department}</span><span>{t.dashboard.status}</span><span>{t.dashboard.headcount}</span><span>{t.dashboard.activeEmployees}</span></div>
            {departmentRows.map((department) => (
              <div className="department-overview__row" key={department.id}>
                <span><strong>{department.name}</strong><small>{department.description || t.dashboard.noDepartmentDescription}</small></span>
                <span data-label={t.dashboard.status}>{department.active ? t.dashboard.active : t.dashboard.inactive}</span>
                <span data-label={t.dashboard.headcount}>{department.employeeCount}</span>
                <span data-label={t.dashboard.activeEmployees}>{department.activeEmployeeCount}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
