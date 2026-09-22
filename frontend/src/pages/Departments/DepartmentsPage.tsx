import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useLanguage } from '../../i18n/useLanguage'
import { formatMessage } from '../../i18n/translations'
import { ApiError } from '../../services/api'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from '../../services/departments'
import type { Department, DepartmentCreate } from '../../types/department'
import './DepartmentsPage.scss'

interface DepartmentFormValues {
  name: string
  description: string
  active: boolean
}

const emptyForm: DepartmentFormValues = {
  name: '',
  description: '',
  active: true,
}

export function DepartmentsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [formValues, setFormValues] = useState<DepartmentFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingDepartmentId, setDeletingDepartmentId] = useState<number | null>(null)
  const canManageDepartments = user?.role === 'ADMIN' || user?.role === 'MANAGER'

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

    getDepartments()
      .then((departmentList) => {
        if (isCurrent) setDepartments(departmentList)
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

  async function handleRetry() {
    setIsLoading(true)
    setLoadError(false)
    try {
      setDepartments(await getDepartments())
    } catch (error) {
      if (!handleUnauthorized(error)) setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingDepartment(null)
    setFormValues(emptyForm)
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function openEditForm(department: Department) {
    setEditingDepartment(department)
    setFormValues({
      name: department.name,
      description: department.description ?? '',
      active: department.active,
    })
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingDepartment(null)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const name = formValues.name.trim()
    if (!name) {
      setFormError(t.departments.nameRequired)
      return
    }

    const description = formValues.description.trim()
    const departmentData: DepartmentCreate = {
      name,
      description: description || null,
      active: formValues.active,
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (editingDepartment) {
        const updatedDepartment = await updateDepartment(editingDepartment.id, departmentData)
        setDepartments((current) => current.map((department) => (
          department.id === updatedDepartment.id ? updatedDepartment : department
        )))
      } else {
        const createdDepartment = await createDepartment(departmentData)
        setDepartments((current) => [...current, createdDepartment])
      }
      closeForm()
    } catch (error) {
      if (handleUnauthorized(error)) return
      setFormError(
        error instanceof ApiError && error.status === 409
          ? t.departments.duplicateNameError
          : t.departments.saveError,
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(department: Department) {
    if (!window.confirm(formatMessage(t.departments.deleteConfirmation, { name: department.name }))) return

    setDeletingDepartmentId(department.id)
    setActionError(null)
    try {
      await deleteDepartment(department.id)
      setDepartments((current) => current.filter((item) => item.id !== department.id))
      if (editingDepartment?.id === department.id) closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setActionError(t.departments.deleteError)
    } finally {
      setDeletingDepartmentId(null)
    }
  }

  const activeDepartmentCount = departments.filter((department) => department.active).length

  return (
    <div className="page departments-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.departments.eyebrow}</p>
          <h2>{t.departments.title}</h2>
          <p>{t.departments.description}</p>
        </div>
        <div className="departments-page__heading-actions">
          <span className="record-count">{formatMessage(t.departments.count, { count: departments.length })}</span>
          {canManageDepartments && (
            <button className="departments-page__button departments-page__button--primary" type="button" onClick={openCreateForm}>
              {t.departments.createDepartment}
            </button>
          )}
        </div>
      </section>

      {isFormOpen && canManageDepartments && (
        <section className="data-card department-form" aria-labelledby="department-form-heading">
          <div className="data-card__header">
            <div>
              <h3 id="department-form-heading">{editingDepartment ? t.departments.editDepartment : t.departments.createDepartment}</h3>
              <p>{t.departments.formDescription}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="department-form__fields">
              <label>
                <span>{t.departments.name}</span>
                <input required value={formValues.name} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="department-form__description">
                <span>{t.departments.departmentDescription}</span>
                <textarea rows={3} value={formValues.description} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="department-form__checkbox">
                <input type="checkbox" checked={formValues.active} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, active: event.target.checked }))} />
                <span>{t.departments.activeDepartment}</span>
              </label>
            </div>
            {formError && <p className="department-form__error" role="alert">{formError}</p>}
            <div className="department-form__actions">
              <button className="departments-page__button departments-page__button--primary" type="submit" disabled={isSaving}>
                {isSaving ? t.departments.saving : t.departments.save}
              </button>
              <button className="departments-page__button" type="button" disabled={isSaving} onClick={closeForm}>{t.departments.cancel}</button>
            </div>
          </form>
        </section>
      )}

      {actionError && <p className="departments-page__action-error" role="alert">{actionError}</p>}

      <section className="data-card" aria-labelledby="department-table-heading">
        <div className="data-card__header">
          <div><h3 id="department-table-heading">{t.departments.register}</h3><p>{t.departments.registerDescription}</p></div>
          <span>{formatMessage(t.departments.activeCount, { count: activeDepartmentCount })}</span>
        </div>
        {isLoading && <div className="departments-page__state" role="status">{t.departments.loading}</div>}
        {!isLoading && loadError && (
          <div className="departments-page__state" role="alert">
            <strong>{t.departments.loadError}</strong>
            <button className="departments-page__button" type="button" onClick={handleRetry}>{t.departments.retry}</button>
          </div>
        )}
        {!isLoading && !loadError && departments.length === 0 && (
          <div className="departments-page__state">
            <strong>{t.departments.emptyTitle}</strong>
            <span>{t.departments.emptyDescription}</span>
          </div>
        )}
        {!isLoading && !loadError && departments.length > 0 && <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.departments.department}</th><th scope="col">{t.departments.departmentDescription}</th><th scope="col">{t.departments.status}</th>{canManageDepartments && <th scope="col">{t.departments.actions}</th>}</tr></thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department.id}>
                  <td><span className="department-name"><span aria-hidden="true">{department.name.slice(0, 2).toUpperCase()}</span><strong>{department.name}</strong></span></td>
                  <td className="department-description">{department.description || t.departments.noDescription}</td>
                  <td><span className={`status${department.active ? '' : ' status--inactive'}`}>{department.active ? t.departments.active : t.departments.inactive}</span></td>
                  {canManageDepartments && (
                    <td>
                      <div className="department-actions">
                        <button type="button" onClick={() => openEditForm(department)}>{t.departments.edit}</button>
                        <button className="department-actions__delete" type="button" disabled={deletingDepartmentId === department.id} onClick={() => handleDelete(department)}>
                          {deletingDepartmentId === department.id ? t.departments.deleting : t.departments.delete}
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
