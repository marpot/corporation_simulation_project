import { StatCard } from '../../components/StatCard/StatCard'
import { useLanguage } from '../../i18n/useLanguage'
import { formatDate, formatMessage } from '../../i18n/translations'
import {
  allocationSummary,
  dashboardStatistics,
  departments,
  operationalActivities,
  projects,
} from '../../data/mockData'
import './DashboardPage.scss'

function statusClass(status: string) {
  return status.toLowerCase().replace(' ', '-')
}

export function DashboardPage() {
  const { language, t } = useLanguage()

  return (
    <div className="page dashboard-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.dashboard.eyebrow}</p>
          <h2>{t.dashboard.title}</h2>
          <p>{t.dashboard.description}</p>
        </div>
        <span className="data-as-of">{t.dashboard.dataAsOf}</span>
      </section>

      <section className="dashboard-page__stats" aria-label={t.dashboard.statisticsLabel}>
        {dashboardStatistics.map((statistic) => <StatCard key={statistic.id} statistic={statistic} />)}
      </section>

      <div className="dashboard-page__primary-grid">
        <section className="operations-panel operations-panel--projects">
          <div className="operations-panel__header">
            <div><h3>{t.dashboard.activeProjects}</h3><p>{t.dashboard.activeProjectsDescription}</p></div>
            <span>{formatMessage(t.dashboard.shown, { count: projects.length })}</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th scope="col">{t.dashboard.project}</th><th scope="col">{t.dashboard.owner}</th><th scope="col">{t.dashboard.status}</th><th scope="col">{t.dashboard.progress}</th><th scope="col">{t.dashboard.due}</th></tr></thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td><strong className="table-primary">{t.domain.projectNames[project.name]}</strong><span className="table-secondary">{t.domain.departmentNames[project.department]}</span></td>
                    <td>{project.owner}</td>
                    <td><span className={`status status--${statusClass(project.status)}`}>{t.domain.projectStatus[project.status]}</span></td>
                    <td><div className="table-progress"><progress value={project.progress} max="100" /><span>{project.progress}%</span></div></td>
                    <td>{formatDate(project.dueDate, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="operations-panel allocation-panel">
          <div className="operations-panel__header"><div><h3>{t.dashboard.employeeAllocation}</h3><p>{t.dashboard.workforceAvailability}</p></div></div>
          <div className="allocation-list">
            {allocationSummary.map((item) => (
              <div className="allocation-list__item" key={item.id}>
                <div><span>{t.dashboard.allocation[item.id].label}</span><strong>{item.employeeCount}</strong></div>
                <progress value={item.percentage} max="100" aria-label={formatMessage(t.dashboard.allocationAria, { label: t.dashboard.allocation[item.id].label, percentage: item.percentage })} />
                <p>{item.percentage}% · {t.dashboard.allocation[item.id].detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-page__secondary-grid">
        <section className="operations-panel">
          <div className="operations-panel__header"><div><h3>{t.dashboard.departmentOverview}</h3><p>{t.dashboard.departmentOverviewDescription}</p></div></div>
          <div className="department-overview">
            <div className="department-overview__head"><span>{t.dashboard.department}</span><span>{t.dashboard.headcount}</span><span>{t.dashboard.projects}</span><span>{t.dashboard.allocated}</span></div>
            {departments.slice(0, 5).map((department) => (
              <div className="department-overview__row" key={department.id}>
                <span><strong>{t.domain.departmentNames[department.name]}</strong><small>{department.lead}</small></span>
                <span>{department.employeeCount}</span>
                <span>{department.activeProjects}</span>
                <span>{department.allocationPercent}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="operations-panel">
          <div className="operations-panel__header"><div><h3>{t.dashboard.recentActivity}</h3><p>{t.dashboard.recentActivityDescription}</p></div></div>
          <ol className="activity-list">
            {operationalActivities.map((activity) => (
              <li key={activity.id}>
                <span className={`activity-list__marker activity-list__marker--${activity.category.toLowerCase()}`} aria-hidden="true" />
                <div>
                  <span>{t.domain.activityCategories[activity.category]} · {t.domain.activityTimes[activity.occurredAt]}</span>
                  <strong>{t.domain.activities[activity.activityId].title}</strong>
                  <p>{t.domain.activities[activity.activityId].detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
