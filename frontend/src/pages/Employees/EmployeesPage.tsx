import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { useUnauthorizedHandler } from '@/auth/useUnauthorizedHandler'
import { useLanguage } from '@/i18n/useLanguage'
import { formatMessage } from '@/i18n/translations'
import { getDepartments } from '@/services/departments'
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from '@/services/employees'
import type { Employee, EmployeeCreate, Seniority } from '@/types/employee'
import type { Department } from '@/types/department'
import './EmployeesPage.scss'

interface EmployeeFormValues {
  firstName: string
  lastName: string
  position: string
  seniority: Seniority
  weeklyCapacity: string
  active: boolean
  departmentId: string
}

const emptyForm: EmployeeFormValues = {
  firstName: '',
  lastName: '',
  position: '',
  seniority: 'MID',
  weeklyCapacity: '40',
  active: true,
  departmentId: '',
}

const seniorityLevels: Seniority[] = ['JUNIOR', 'MID', 'SENIOR', 'LEAD']

function employeeInitials(employee: Employee) {
  return `${employee.first_name.charAt(0)}${employee.last_name.charAt(0)}`.toUpperCase()
}

export function EmployeesPage() {
  const { user } = useAuth()
  const handleUnauthorized = useUnauthorizedHandler()
  const { t } = useLanguage()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [areDepartmentsLoading, setAreDepartmentsLoading] = useState(true)
  const [departmentsLoadError, setDepartmentsLoadError] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formValues, setFormValues] = useState<EmployeeFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null)
  const canManageEmployees = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  useEffect(() => {
    let isCurrent = true

    getEmployees()
      .then((employeeList) => {
        if (isCurrent) setEmployees(employeeList)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [handleUnauthorized])

  useEffect(() => {
    let isCurrent = true

    getDepartments()
      .then((departmentList) => {
        if (isCurrent) setDepartments(departmentList)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setDepartmentsLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setAreDepartmentsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [handleUnauthorized])

  async function handleRetry() {
    setIsLoading(true)
    setLoadError(false)
    try {
      setEmployees(await getEmployees())
    } catch (error) {
      if (!handleUnauthorized(error)) setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDepartmentsRetry() {
    setAreDepartmentsLoading(true)
    setDepartmentsLoadError(false)
    try {
      setDepartments(await getDepartments())
    } catch (error) {
      if (!handleUnauthorized(error)) setDepartmentsLoadError(true)
    } finally {
      setAreDepartmentsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingEmployee(null)
    setFormValues(emptyForm)
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function openEditForm(employee: Employee) {
    setEditingEmployee(employee)
    setFormValues({
      firstName: employee.first_name,
      lastName: employee.last_name,
      position: employee.position,
      seniority: employee.seniority,
      weeklyCapacity: String(employee.weekly_capacity),
      active: employee.active,
      departmentId: employee.department_id === null || employee.department_id === undefined
        ? ''
        : String(employee.department_id),
    })
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingEmployee(null)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const firstName = formValues.firstName.trim()
    const lastName = formValues.lastName.trim()
    const position = formValues.position.trim()
    const weeklyCapacity = Number(formValues.weeklyCapacity)

    if (!firstName || !lastName || !position) {
      setFormError(t.employees.requiredFieldsError)
      return
    }
    if (!Number.isInteger(weeklyCapacity) || weeklyCapacity <= 0) {
      setFormError(t.employees.capacityError)
      return
    }

    const employeeData: EmployeeCreate = {
      first_name: firstName,
      last_name: lastName,
      position,
      seniority: formValues.seniority,
      weekly_capacity: weeklyCapacity,
      active: formValues.active,
    }

    if (!areDepartmentsLoading && !departmentsLoadError) {
      employeeData.department_id = formValues.departmentId === ''
        ? null
        : Number(formValues.departmentId)
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (editingEmployee) {
        const updatedEmployee = await updateEmployee(editingEmployee.id, employeeData)
        setEmployees((current) => current.map((employee) => (
          employee.id === updatedEmployee.id ? updatedEmployee : employee
        )))
      } else {
        const createdEmployee = await createEmployee(employeeData)
        setEmployees((current) => [...current, createdEmployee])
      }
      closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setFormError(t.employees.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(employee: Employee) {
    const employeeName = `${employee.first_name} ${employee.last_name}`
    if (!window.confirm(formatMessage(t.employees.deleteConfirmation, { name: employeeName }))) return

    setDeletingEmployeeId(employee.id)
    setActionError(null)
    try {
      await deleteEmployee(employee.id)
      setEmployees((current) => current.filter((item) => item.id !== employee.id))
      if (editingEmployee?.id === employee.id) closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setActionError(t.employees.deleteError)
    } finally {
      setDeletingEmployeeId(null)
    }
  }

  const activeEmployeeCount = employees.filter((employee) => employee.active).length
  const availableDepartments = departments.filter((department) => (
    department.active || department.id === editingEmployee?.department_id
  ))

  function getDepartmentName(departmentId: number | null | undefined) {
    if (departmentId === null || departmentId === undefined) return t.employees.unassigned
    return departments.find((department) => department.id === departmentId)?.name
      ?? t.employees.departmentUnavailable
  }

  return (
    <div className="page employees-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.employees.eyebrow}</p>
          <h2>{t.employees.title}</h2>
          <p>{t.employees.description}</p>
        </div>
        <div className="employees-page__heading-actions">
          <span className="record-count">{formatMessage(t.employees.count, { count: employees.length })}</span>
          {canManageEmployees && (
            <button className="employees-page__button employees-page__button--primary" type="button" onClick={openCreateForm}>
              {t.employees.createEmployee}
            </button>
          )}
        </div>
      </section>

      {departmentsLoadError && (
        <div className="employees-page__department-notice" role="alert" id="department-load-error">
          <span>{t.employees.departmentsLoadError}</span>
          <button className="employees-page__button" type="button" onClick={handleDepartmentsRetry}>
            {t.employees.retryDepartments}
          </button>
        </div>
      )}

      {isFormOpen && canManageEmployees && (
        <section className="data-card employee-form" aria-labelledby="employee-form-heading">
          <div className="data-card__header">
            <div>
              <h3 id="employee-form-heading">{editingEmployee ? t.employees.editEmployee : t.employees.createEmployee}</h3>
              <p>{t.employees.formDescription}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="employee-form__fields">
              <label>
                <span>{t.employees.firstName}</span>
                <input required value={formValues.firstName} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, firstName: event.target.value }))} />
              </label>
              <label>
                <span>{t.employees.lastName}</span>
                <input required value={formValues.lastName} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, lastName: event.target.value }))} />
              </label>
              <label>
                <span>{t.employees.position}</span>
                <input required value={formValues.position} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, position: event.target.value }))} />
              </label>
              <label>
                <span>{t.employees.seniority}</span>
                <select value={formValues.seniority} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, seniority: event.target.value as Seniority }))}>
                  {seniorityLevels.map((seniority) => <option key={seniority} value={seniority}>{t.employees.seniorityLevels[seniority]}</option>)}
                </select>
              </label>
              <label>
                <span>{t.employees.weeklyCapacity}</span>
                <input type="number" min="1" step="1" required value={formValues.weeklyCapacity} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, weeklyCapacity: event.target.value }))} />
              </label>
              <label>
                <span>{t.employees.department}</span>
                <select
                  value={formValues.departmentId}
                  disabled={isSaving || areDepartmentsLoading || departmentsLoadError}
                  aria-describedby={departmentsLoadError ? 'department-load-error' : undefined}
                  onChange={(event) => setFormValues((current) => ({ ...current, departmentId: event.target.value }))}
                >
                  {areDepartmentsLoading
                    ? <option value="">{t.employees.departmentsLoading}</option>
                    : <>
                      <option value="">{t.employees.unassigned}</option>
                      {availableDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}{department.active ? '' : ` (${t.employees.inactive})`}
                        </option>
                      ))}
                    </>}
                </select>
              </label>
              <label className="employee-form__checkbox">
                <input type="checkbox" checked={formValues.active} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, active: event.target.checked }))} />
                <span>{t.employees.activeEmployee}</span>
              </label>
            </div>
            {formError && <p className="employee-form__error" role="alert">{formError}</p>}
            <div className="employee-form__actions">
              <button className="employees-page__button employees-page__button--primary" type="submit" disabled={isSaving}>
                {isSaving ? t.employees.saving : t.employees.save}
              </button>
              <button className="employees-page__button" type="button" disabled={isSaving} onClick={closeForm}>{t.employees.cancel}</button>
            </div>
          </form>
        </section>
      )}

      {actionError && <p className="employees-page__action-error" role="alert">{actionError}</p>}

      <section className="data-card" aria-labelledby="employee-table-heading">
        <div className="data-card__header">
          <div><h3 id="employee-table-heading">{t.employees.directory}</h3><p>{t.employees.directoryDescription}</p></div>
          <span>{formatMessage(t.employees.activeCount, { count: activeEmployeeCount })}</span>
        </div>
        {isLoading && <div className="employees-page__state" role="status">{t.employees.loading}</div>}
        {!isLoading && loadError && (
          <div className="employees-page__state" role="alert">
            <strong>{t.employees.loadError}</strong>
            <button className="employees-page__button" type="button" onClick={handleRetry}>{t.employees.retry}</button>
          </div>
        )}
        {!isLoading && !loadError && employees.length === 0 && (
          <div className="employees-page__state">
            <strong>{t.employees.emptyTitle}</strong>
            <span>{t.employees.emptyDescription}</span>
          </div>
        )}
        {!isLoading && !loadError && employees.length > 0 && <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.employees.employee}</th><th scope="col">{t.employees.department}</th><th scope="col">{t.employees.position}</th><th scope="col">{t.employees.seniority}</th><th scope="col">{t.employees.weeklyCapacity}</th><th scope="col">{t.employees.status}</th>{canManageEmployees && <th scope="col">{t.employees.actions}</th>}</tr></thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="employee-cell">
                      <span className="employee-cell__avatar" aria-hidden="true">{employeeInitials(employee)}</span>
                      <div><strong>{employee.first_name} {employee.last_name}</strong></div>
                    </div>
                  </td>
                  <td>{getDepartmentName(employee.department_id)}</td>
                  <td>{employee.position}</td>
                  <td>{t.employees.seniorityLevels[employee.seniority]}</td>
                  <td>{formatMessage(t.employees.hoursPerWeek, { count: employee.weekly_capacity })}</td>
                  <td><span className={`status${employee.active ? '' : ' status--inactive'}`}>{employee.active ? t.employees.active : t.employees.inactive}</span></td>
                  {canManageEmployees && (
                    <td>
                      <div className="employee-actions">
                        <button type="button" onClick={() => openEditForm(employee)}>{t.employees.edit}</button>
                        <button className="employee-actions__delete" type="button" disabled={deletingEmployeeId === employee.id} onClick={() => handleDelete(employee)}>
                          {deletingEmployeeId === employee.id ? t.employees.deleting : t.employees.delete}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
    </div>
  )
}
