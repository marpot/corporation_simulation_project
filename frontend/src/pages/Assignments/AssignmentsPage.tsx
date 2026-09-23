import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useLanguage } from '@/i18n/useLanguage'
import { formatDate, formatMessage } from '@/i18n/translations'
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from '@/services/assignments'
import { ApiError } from '@/services/api'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import type { Assignment, AssignmentCreate } from '@/types/assignment'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import './AssignmentsPage.scss'

interface AssignmentFormValues {
  employeeId: string
  projectId: string
  allocationPercent: string
  startDate: string
  endDate: string
}

const emptyForm: AssignmentFormValues = {
  employeeId: '',
  projectId: '',
  allocationPercent: '',
  startDate: '',
  endDate: '',
}

export function AssignmentsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { language, t } = useLanguage()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [areEmployeesLoading, setAreEmployeesLoading] = useState(true)
  const [employeesLoadError, setEmployeesLoadError] = useState(false)
  const [areProjectsLoading, setAreProjectsLoading] = useState(true)
  const [projectsLoadError, setProjectsLoadError] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [formValues, setFormValues] = useState<AssignmentFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<number | null>(null)
  const canManageAssignments = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return true
    }
    return false
  }, [logout, navigate])

  useEffect(() => {
    let isCurrent = true
    getAssignments()
      .then((items) => {
        if (isCurrent) setAssignments(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized])

  useEffect(() => {
    let isCurrent = true
    getEmployees()
      .then((items) => {
        if (isCurrent) setEmployees(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setEmployeesLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setAreEmployeesLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized])

  useEffect(() => {
    let isCurrent = true
    getProjects()
      .then((items) => {
        if (isCurrent) setProjects(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setProjectsLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setAreProjectsLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized])

  async function handleRetry() {
    setIsLoading(true)
    setLoadError(false)
    try {
      setAssignments(await getAssignments())
    } catch (error) {
      if (!handleUnauthorized(error)) setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleEmployeesRetry() {
    setAreEmployeesLoading(true)
    setEmployeesLoadError(false)
    try {
      setEmployees(await getEmployees())
    } catch (error) {
      if (!handleUnauthorized(error)) setEmployeesLoadError(true)
    } finally {
      setAreEmployeesLoading(false)
    }
  }

  async function handleProjectsRetry() {
    setAreProjectsLoading(true)
    setProjectsLoadError(false)
    try {
      setProjects(await getProjects())
    } catch (error) {
      if (!handleUnauthorized(error)) setProjectsLoadError(true)
    } finally {
      setAreProjectsLoading(false)
    }
  }

  function employeeName(employeeId: number) {
    const employee = employees.find((item) => item.id === employeeId)
    if (employee) return `${employee.first_name} ${employee.last_name}`
    return areEmployeesLoading ? t.assignments.employeesLoading : t.assignments.employeeUnavailable
  }

  function projectName(projectId: number) {
    const project = projects.find((item) => item.id === projectId)
    if (project) return project.name
    return areProjectsLoading ? t.assignments.projectsLoading : t.assignments.projectUnavailable
  }

  function openCreateForm() {
    setEditingAssignment(null)
    setFormValues(emptyForm)
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function openEditForm(assignment: Assignment) {
    setEditingAssignment(assignment)
    setFormValues({
      employeeId: String(assignment.employee_id),
      projectId: String(assignment.project_id),
      allocationPercent: String(assignment.allocation_percent),
      startDate: assignment.start_date,
      endDate: assignment.end_date ?? '',
    })
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingAssignment(null)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const allocationPercent = Number(formValues.allocationPercent)
    if (!formValues.employeeId || !formValues.projectId || !formValues.startDate || !formValues.allocationPercent) {
      setFormError(t.assignments.requiredFieldsError)
      return
    }
    if (!Number.isInteger(allocationPercent) || allocationPercent < 1 || allocationPercent > 100) {
      setFormError(t.assignments.allocationError)
      return
    }
    if (formValues.endDate && formValues.endDate < formValues.startDate) {
      setFormError(t.assignments.invalidDateRange)
      return
    }

    const assignmentData: AssignmentCreate = {
      employee_id: Number(formValues.employeeId),
      project_id: Number(formValues.projectId),
      allocation_percent: allocationPercent,
      start_date: formValues.startDate,
      end_date: formValues.endDate || null,
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (editingAssignment) {
        const updated = await updateAssignment(editingAssignment.id, assignmentData)
        setAssignments((current) => current.map((assignment) => (
          assignment.id === updated.id ? updated : assignment
        )))
      } else {
        const created = await createAssignment(assignmentData)
        setAssignments((current) => [...current, created])
      }
      closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setFormError(t.assignments.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(assignment: Assignment) {
    const employee = employeeName(assignment.employee_id)
    const project = projectName(assignment.project_id)
    if (!window.confirm(formatMessage(t.assignments.deleteConfirmation, { employee, project }))) return

    setDeletingAssignmentId(assignment.id)
    setActionError(null)
    try {
      await deleteAssignment(assignment.id)
      setAssignments((current) => current.filter((item) => item.id !== assignment.id))
      if (editingAssignment?.id === assignment.id) closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setActionError(t.assignments.deleteError)
    } finally {
      setDeletingAssignmentId(null)
    }
  }

  const editingEmployeeMissing = editingAssignment !== null
    && !employees.some((employee) => employee.id === editingAssignment.employee_id)
  const editingProjectMissing = editingAssignment !== null
    && !projects.some((project) => project.id === editingAssignment.project_id)

  return (
    <div className="page assignments-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.assignments.eyebrow}</p>
          <h2>{t.assignments.title}</h2>
          <p>{t.assignments.description}</p>
        </div>
        <div className="assignments-page__heading-actions">
          <span className="record-count">{formatMessage(t.assignments.count, { count: assignments.length })}</span>
          {canManageAssignments && (
            <button className="assignments-page__button assignments-page__button--primary" type="button" onClick={openCreateForm}>
              {t.assignments.createAssignment}
            </button>
          )}
        </div>
      </section>

      {employeesLoadError && (
        <div className="assignments-page__support-notice" role="alert" id="employees-load-error">
          <span>{t.assignments.employeesLoadError}</span>
          <button className="assignments-page__button" type="button" onClick={handleEmployeesRetry}>{t.assignments.retryEmployees}</button>
        </div>
      )}
      {projectsLoadError && (
        <div className="assignments-page__support-notice" role="alert" id="projects-load-error">
          <span>{t.assignments.projectsLoadError}</span>
          <button className="assignments-page__button" type="button" onClick={handleProjectsRetry}>{t.assignments.retryProjects}</button>
        </div>
      )}

      {isFormOpen && canManageAssignments && (
        <section className="data-card assignment-form" aria-labelledby="assignment-form-heading">
          <div className="data-card__header">
            <div>
              <h3 id="assignment-form-heading">{editingAssignment ? t.assignments.editAssignment : t.assignments.createAssignment}</h3>
              <p>{t.assignments.formDescription}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="assignment-form__fields">
              <label>
                <span>{t.assignments.employee}</span>
                <select
                  required
                  value={formValues.employeeId}
                  disabled={isSaving || areEmployeesLoading || employeesLoadError}
                  aria-describedby={employeesLoadError ? 'employees-load-error' : undefined}
                  onChange={(event) => setFormValues((current) => ({ ...current, employeeId: event.target.value }))}
                >
                  <option value="" disabled>{areEmployeesLoading ? t.assignments.employeesLoading : t.assignments.selectEmployee}</option>
                  {editingEmployeeMissing && editingAssignment && (
                    <option value={editingAssignment.employee_id}>{t.assignments.employeeUnavailable}</option>
                  )}
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t.assignments.project}</span>
                <select
                  required
                  value={formValues.projectId}
                  disabled={isSaving || areProjectsLoading || projectsLoadError}
                  aria-describedby={projectsLoadError ? 'projects-load-error' : undefined}
                  onChange={(event) => setFormValues((current) => ({ ...current, projectId: event.target.value }))}
                >
                  <option value="" disabled>{areProjectsLoading ? t.assignments.projectsLoading : t.assignments.selectProject}</option>
                  {editingProjectMissing && editingAssignment && (
                    <option value={editingAssignment.project_id}>{t.assignments.projectUnavailable}</option>
                  )}
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </label>
              <label>
                <span>{t.assignments.allocationPercent}</span>
                <input type="number" required min="1" max="100" step="1" value={formValues.allocationPercent} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, allocationPercent: event.target.value }))} />
              </label>
              <label>
                <span>{t.assignments.startDate}</span>
                <input type="date" required value={formValues.startDate} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, startDate: event.target.value }))} />
              </label>
              <label>
                <span>{t.assignments.endDate}</span>
                <input type="date" min={formValues.startDate || undefined} value={formValues.endDate} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, endDate: event.target.value }))} />
              </label>
            </div>
            {formError && <p className="assignment-form__error" role="alert">{formError}</p>}
            <div className="assignment-form__actions">
              <button className="assignments-page__button assignments-page__button--primary" type="submit" disabled={isSaving}>
                {isSaving ? t.assignments.saving : t.assignments.save}
              </button>
              <button className="assignments-page__button" type="button" disabled={isSaving} onClick={closeForm}>{t.assignments.cancel}</button>
            </div>
          </form>
        </section>
      )}

      {actionError && <p className="assignments-page__action-error" role="alert">{actionError}</p>}

      <section className="data-card" aria-labelledby="assignment-table-heading">
        <div className="data-card__header">
          <div><h3 id="assignment-table-heading">{t.assignments.register}</h3><p>{t.assignments.registerDescription}</p></div>
        </div>
        {isLoading && <div className="assignments-page__state" role="status">{t.assignments.loading}</div>}
        {!isLoading && loadError && (
          <div className="assignments-page__state" role="alert">
            <strong>{t.assignments.loadError}</strong>
            <button className="assignments-page__button" type="button" onClick={handleRetry}>{t.assignments.retry}</button>
          </div>
        )}
        {!isLoading && !loadError && assignments.length === 0 && (
          <div className="assignments-page__state">
            <strong>{t.assignments.emptyTitle}</strong>
            <span>{t.assignments.emptyDescription}</span>
          </div>
        )}
        {!isLoading && !loadError && assignments.length > 0 && <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.assignments.employee}</th><th scope="col">{t.assignments.project}</th><th scope="col">{t.assignments.allocation}</th><th scope="col">{t.assignments.startDate}</th><th scope="col">{t.assignments.endDate}</th>{canManageAssignments && <th scope="col">{t.assignments.actions}</th>}</tr></thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td><strong className="table-primary">{employeeName(assignment.employee_id)}</strong></td>
                  <td><strong className="table-primary">{projectName(assignment.project_id)}</strong></td>
                  <td><span className="assignment-allocation">{assignment.allocation_percent}%</span></td>
                  <td>{formatDate(assignment.start_date, language)}</td>
                  <td>{assignment.end_date ? formatDate(assignment.end_date, language) : t.assignments.ongoing}</td>
                  {canManageAssignments && (
                    <td>
                      <div className="assignment-actions">
                        <button type="button" onClick={() => openEditForm(assignment)}>{t.assignments.edit}</button>
                        <button className="assignment-actions__delete" type="button" disabled={deletingAssignmentId === assignment.id} onClick={() => handleDelete(assignment)}>
                          {deletingAssignmentId === assignment.id ? t.assignments.deleting : t.assignments.delete}
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
