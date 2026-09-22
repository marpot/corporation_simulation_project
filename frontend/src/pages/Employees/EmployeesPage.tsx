import { employees } from '../../data/mockData'
import { useLanguage } from '../../i18n/useLanguage'
import { formatMessage } from '../../i18n/translations'
import './EmployeesPage.scss'

export function EmployeesPage() {
  const { t } = useLanguage()
  const activeEmployeeCount = employees.filter((employee) => employee.status === 'Active').length

  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.employees.eyebrow}</p>
          <h2>{t.employees.title}</h2>
          <p>{t.employees.description}</p>
        </div>
        <span className="record-count">{formatMessage(t.employees.sampleRecords, { count: employees.length })}</span>
      </section>

      <section className="data-card" aria-labelledby="employee-table-heading">
        <div className="data-card__header">
          <div><h3 id="employee-table-heading">{t.employees.directory}</h3><p>{t.employees.directoryDescription}</p></div>
          <span>{formatMessage(t.employees.activeCount, { count: activeEmployeeCount })}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.employees.employee}</th><th scope="col">{t.employees.role}</th><th scope="col">{t.employees.department}</th><th scope="col">{t.employees.currentAssignment}</th><th scope="col">{t.employees.allocation}</th><th scope="col">{t.employees.status}</th></tr></thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-cell">
                      <span className="employee-cell__avatar" aria-hidden="true">{employee.initials}</span>
                      <div><strong>{employee.name}</strong><span>{employee.email}</span></div>
                    </div>
                  </td>
                  <td>{t.domain.employeeRoles[employee.role]}</td>
                  <td>{t.domain.departmentNames[employee.department]}</td>
                  <td>{employee.currentProject ? t.domain.projectNames[employee.currentProject] : t.employees.unassigned}</td>
                  <td>{employee.allocationPercent}%</td>
                  <td><span className={`status status--${employee.status.toLowerCase().replace(' ', '-')}`}>{t.domain.employeeStatus[employee.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
