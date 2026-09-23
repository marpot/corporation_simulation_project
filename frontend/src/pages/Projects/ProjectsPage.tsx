import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useLanguage } from '../../i18n/useLanguage'
import { formatDate, formatMessage } from '../../i18n/translations'
import { ApiError } from '../../services/api'
import { createProject, deleteProject, getProjects, updateProject } from '../../services/projects'
import type { Project, ProjectCreate, ProjectStatus } from '../../types/project'
import './ProjectsPage.scss'

interface ProjectFormValues {
  name: string
  description: string
  status: ProjectStatus
  startDate: string
  endDate: string
  active: boolean
}

const emptyForm: ProjectFormValues = {
  name: '',
  description: '',
  status: 'PLANNED',
  startDate: '',
  endDate: '',
  active: true,
}

const projectStatuses: ProjectStatus[] = ['PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED']

function projectStatusClass(status: ProjectStatus) {
  return status.toLowerCase().replace('_', '-')
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { language, t } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formValues, setFormValues] = useState<ProjectFormValues>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null)
  const canManageProjects = user?.role === 'ADMIN' || user?.role === 'MANAGER'

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

    getProjects()
      .then((projectList) => {
        if (isCurrent) setProjects(projectList)
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
      setProjects(await getProjects())
    } catch (error) {
      if (!handleUnauthorized(error)) setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }

  function openCreateForm() {
    setEditingProject(null)
    setFormValues(emptyForm)
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function openEditForm(project: Project) {
    setEditingProject(project)
    setFormValues({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date ?? '',
      active: project.active,
    })
    setFormError(null)
    setActionError(null)
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingProject(null)
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    const name = formValues.name.trim()
    if (!name || !formValues.startDate) {
      setFormError(t.projects.requiredFieldsError)
      return
    }
    if (formValues.endDate && formValues.endDate < formValues.startDate) {
      setFormError(t.projects.invalidDateRange)
      return
    }

    const description = formValues.description.trim()
    const projectData: ProjectCreate = {
      name,
      description: description || null,
      status: formValues.status,
      start_date: formValues.startDate,
      end_date: formValues.endDate || null,
      active: formValues.active,
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (editingProject) {
        const updatedProject = await updateProject(editingProject.id, projectData)
        setProjects((current) => current.map((project) => (
          project.id === updatedProject.id ? updatedProject : project
        )))
      } else {
        const createdProject = await createProject(projectData)
        setProjects((current) => [...current, createdProject])
      }
      closeForm()
    } catch (error) {
      if (handleUnauthorized(error)) return
      setFormError(
        error instanceof ApiError && error.status === 422
          ? t.projects.invalidDateRange
          : t.projects.saveError,
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(formatMessage(t.projects.deleteConfirmation, { name: project.name }))) return

    setDeletingProjectId(project.id)
    setActionError(null)
    try {
      await deleteProject(project.id)
      setProjects((current) => current.filter((item) => item.id !== project.id))
      if (editingProject?.id === project.id) closeForm()
    } catch (error) {
      if (!handleUnauthorized(error)) setActionError(t.projects.deleteError)
    } finally {
      setDeletingProjectId(null)
    }
  }

  const activeProjectCount = projects.filter((project) => project.active).length

  return (
    <div className="page projects-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.projects.eyebrow}</p>
          <h2>{t.projects.title}</h2>
          <p>{t.projects.description}</p>
        </div>
        <div className="projects-page__heading-actions">
          <span className="record-count">{formatMessage(t.projects.count, { count: projects.length })}</span>
          {canManageProjects && (
            <button className="projects-page__button projects-page__button--primary" type="button" onClick={openCreateForm}>
              {t.projects.createProject}
            </button>
          )}
        </div>
      </section>

      {isFormOpen && canManageProjects && (
        <section className="data-card project-form" aria-labelledby="project-form-heading">
          <div className="data-card__header">
            <div>
              <h3 id="project-form-heading">{editingProject ? t.projects.editProject : t.projects.createProject}</h3>
              <p>{t.projects.formDescription}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="project-form__fields">
              <label>
                <span>{t.projects.name}</span>
                <input required value={formValues.name} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>{t.projects.status}</span>
                <select value={formValues.status} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as ProjectStatus }))}>
                  {projectStatuses.map((status) => <option key={status} value={status}>{t.projects.statuses[status]}</option>)}
                </select>
              </label>
              <label>
                <span>{t.projects.startDate}</span>
                <input type="date" required value={formValues.startDate} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, startDate: event.target.value }))} />
              </label>
              <label>
                <span>{t.projects.endDate}</span>
                <input type="date" min={formValues.startDate || undefined} value={formValues.endDate} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, endDate: event.target.value }))} />
              </label>
              <label className="project-form__description">
                <span>{t.projects.projectDescription}</span>
                <textarea rows={3} value={formValues.description} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="project-form__checkbox">
                <input type="checkbox" checked={formValues.active} disabled={isSaving} onChange={(event) => setFormValues((current) => ({ ...current, active: event.target.checked }))} />
                <span>{t.projects.activeProject}</span>
              </label>
            </div>
            {formError && <p className="project-form__error" role="alert">{formError}</p>}
            <div className="project-form__actions">
              <button className="projects-page__button projects-page__button--primary" type="submit" disabled={isSaving}>
                {isSaving ? t.projects.saving : t.projects.save}
              </button>
              <button className="projects-page__button" type="button" disabled={isSaving} onClick={closeForm}>{t.projects.cancel}</button>
            </div>
          </form>
        </section>
      )}

      {actionError && <p className="projects-page__action-error" role="alert">{actionError}</p>}

      <section className="data-card" aria-labelledby="project-table-heading">
        <div className="data-card__header">
          <div><h3 id="project-table-heading">{t.projects.register}</h3><p>{t.projects.registerDescription}</p></div>
          <span>{formatMessage(t.projects.activeCount, { count: activeProjectCount })}</span>
        </div>
        {isLoading && <div className="projects-page__state" role="status">{t.projects.loading}</div>}
        {!isLoading && loadError && (
          <div className="projects-page__state" role="alert">
            <strong>{t.projects.loadError}</strong>
            <button className="projects-page__button" type="button" onClick={handleRetry}>{t.projects.retry}</button>
          </div>
        )}
        {!isLoading && !loadError && projects.length === 0 && (
          <div className="projects-page__state">
            <strong>{t.projects.emptyTitle}</strong>
            <span>{t.projects.emptyDescription}</span>
          </div>
        )}
        {!isLoading && !loadError && projects.length > 0 && <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">{t.projects.project}</th><th scope="col">{t.projects.status}</th><th scope="col">{t.projects.startDate}</th><th scope="col">{t.projects.endDate}</th><th scope="col">{t.projects.activeState}</th>{canManageProjects && <th scope="col">{t.projects.actions}</th>}</tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td><strong className="table-primary">{project.name}</strong><span className="project-description">{project.description || t.projects.noDescription}</span></td>
                  <td><span className={`status status--${projectStatusClass(project.status)}`}>{t.projects.statuses[project.status]}</span></td>
                  <td>{formatDate(project.start_date, language)}</td>
                  <td>{project.end_date ? formatDate(project.end_date, language) : t.projects.noEndDate}</td>
                  <td><span className={`status${project.active ? '' : ' status--inactive'}`}>{project.active ? t.projects.active : t.projects.inactive}</span></td>
                  {canManageProjects && (
                    <td>
                      <div className="project-actions">
                        <button type="button" onClick={() => openEditForm(project)}>{t.projects.edit}</button>
                        <button className="project-actions__delete" type="button" disabled={deletingProjectId === project.id} onClick={() => handleDelete(project)}>
                          {deletingProjectId === project.id ? t.projects.deleting : t.projects.delete}
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
