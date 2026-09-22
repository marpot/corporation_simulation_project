import { projects } from '../../data/mockData'
import { useLanguage } from '../../i18n/useLanguage'
import { formatDate, formatMessage } from '../../i18n/translations'
import './ProjectsPage.scss'

function statusClass(status: string) {
  return status.toLowerCase().replace(' ', '-')
}

export function ProjectsPage() {
  const { language, t } = useLanguage()
  const projectsAtRisk = projects.filter((project) => project.status === 'At risk').length

  return (
    <div className="page projects-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.projects.eyebrow}</p>
          <h2>{t.projects.title}</h2>
          <p>{t.projects.description}</p>
        </div>
        <span className="record-count">{formatMessage(t.projects.activeRecords, { count: projects.length })}</span>
      </section>

      <section className="data-card" aria-labelledby="project-table-heading">
        <div className="data-card__header">
          <div><h3 id="project-table-heading">{t.projects.register}</h3><p>{t.projects.registerDescription}</p></div>
          <span>{formatMessage(t.projects.requiresAttention, { count: projectsAtRisk })}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.projects.project}</th><th scope="col">{t.projects.owner}</th><th scope="col">{t.projects.team}</th><th scope="col">{t.projects.status}</th><th scope="col">{t.projects.completion}</th><th scope="col">{t.projects.dueDate}</th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td><strong className="table-primary">{t.domain.projectNames[project.name]}</strong><span className="table-secondary">{t.domain.departmentNames[project.department]}</span></td>
                  <td>{project.owner}</td>
                  <td>{formatMessage(t.projects.peopleCount, { count: project.teamSize })}</td>
                  <td><span className={`status status--${statusClass(project.status)}`}>{t.domain.projectStatus[project.status]}</span></td>
                  <td><div className="project-completion"><progress value={project.progress} max="100" /><span>{project.progress}%</span></div></td>
                  <td>{formatDate(project.dueDate, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
