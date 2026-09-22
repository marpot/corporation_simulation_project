import { departments } from '../../data/mockData'
import { useLanguage } from '../../i18n/useLanguage'
import { formatMessage } from '../../i18n/translations'
import './DepartmentsPage.scss'

export function DepartmentsPage() {
  const { t } = useLanguage()
  const displayedEmployeeCount = departments.reduce((total, department) => total + department.employeeCount, 0)

  return (
    <div className="page departments-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.departments.eyebrow}</p>
          <h2>{t.departments.title}</h2>
          <p>{t.departments.description}</p>
        </div>
        <span className="record-count">{formatMessage(t.departments.count, { count: departments.length })}</span>
      </section>

      <section className="data-card" aria-labelledby="department-table-heading">
        <div className="data-card__header">
          <div><h3 id="department-table-heading">{t.departments.register}</h3><p>{t.departments.registerDescription}</p></div>
          <span>{formatMessage(t.departments.employeesShown, { count: displayedEmployeeCount })}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.departments.department}</th><th scope="col">{t.departments.departmentLead}</th><th scope="col">{t.departments.primaryOffice}</th><th scope="col">{t.departments.headcount}</th><th scope="col">{t.departments.activeProjects}</th><th scope="col">{t.departments.allocation}</th></tr></thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id}>
                  <td><span className="department-name"><span aria-hidden="true">{department.name.slice(0, 2).toUpperCase()}</span><strong>{t.domain.departmentNames[department.name]}</strong></span></td>
                  <td>{department.lead}</td>
                  <td>{department.location}</td>
                  <td><strong className="numeric-value">{department.employeeCount}</strong></td>
                  <td>{department.activeProjects}</td>
                  <td><div className="allocation-cell"><progress value={department.allocationPercent} max="100" /><span>{department.allocationPercent}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
