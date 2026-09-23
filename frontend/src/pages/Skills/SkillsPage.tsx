import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { useLanguage } from '@/i18n/useLanguage'
import { formatMessage } from '@/i18n/translations'
import { ApiError } from '@/services/api'
import { getEmployees } from '@/services/employees'
import { getProjects } from '@/services/projects'
import {
  createEmployeeSkill,
  createProjectSkill,
  createSkill,
  deleteEmployeeSkill,
  deleteProjectSkill,
  deleteSkill,
  getEmployeeSkills,
  getProjectSkills,
  getSkills,
  updateEmployeeSkill,
  updateProjectSkill,
  updateSkill,
} from '@/services/skills'
import type { Employee } from '@/types/employee'
import type { Project } from '@/types/project'
import type { EmployeeSkill, ProjectSkill, Skill, SkillLevel } from '@/types/skill'
import './SkillsPage.scss'

const skillLevels: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

interface Feedback {
  message: string
  error: boolean
}

export function SkillsPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [skills, setSkills] = useState<Skill[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [skillsError, setSkillsError] = useState(false)
  const [employeesError, setEmployeesError] = useState(false)
  const [projectsError, setProjectsError] = useState(false)

  const [skillFormOpen, setSkillFormOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillName, setSkillName] = useState('')
  const [skillFormError, setSkillFormError] = useState<string | null>(null)
  const [skillSaving, setSkillSaving] = useState(false)
  const [deletingSkillId, setDeletingSkillId] = useState<number | null>(null)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([])
  const [employeeSkillsLoading, setEmployeeSkillsLoading] = useState(false)
  const [employeeSkillsError, setEmployeeSkillsError] = useState(false)
  const [employeeSkillId, setEmployeeSkillId] = useState('')
  const [employeeSkillLevel, setEmployeeSkillLevel] = useState<SkillLevel>('BEGINNER')
  const [employeeSkillSaving, setEmployeeSkillSaving] = useState(false)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [projectSkills, setProjectSkills] = useState<ProjectSkill[]>([])
  const [projectSkillsLoading, setProjectSkillsLoading] = useState(false)
  const [projectSkillsError, setProjectSkillsError] = useState(false)
  const [projectSkillId, setProjectSkillId] = useState('')
  const [projectSkillLevel, setProjectSkillLevel] = useState<SkillLevel>('BEGINNER')
  const [projectSkillSaving, setProjectSkillSaving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const handleUnauthorized = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return true
    }
    return false
  }, [logout, navigate])

  useEffect(() => {
    let current = true
    getSkills()
      .then((items) => { if (current) setSkills(items) })
      .catch((error: unknown) => { if (!handleUnauthorized(error) && current) setSkillsError(true) })
      .finally(() => { if (current) setSkillsLoading(false) })
    return () => { current = false }
  }, [handleUnauthorized])

  useEffect(() => {
    let current = true
    getEmployees()
      .then((items) => { if (current) setEmployees(items) })
      .catch((error: unknown) => { if (!handleUnauthorized(error) && current) setEmployeesError(true) })
      .finally(() => { if (current) setEmployeesLoading(false) })
    return () => { current = false }
  }, [handleUnauthorized])

  useEffect(() => {
    let current = true
    getProjects()
      .then((items) => { if (current) setProjects(items) })
      .catch((error: unknown) => { if (!handleUnauthorized(error) && current) setProjectsError(true) })
      .finally(() => { if (current) setProjectsLoading(false) })
    return () => { current = false }
  }, [handleUnauthorized])

  useEffect(() => {
    if (!selectedEmployeeId) return
    let current = true
    getEmployeeSkills(Number(selectedEmployeeId))
      .then((items) => { if (current) setEmployeeSkills(items) })
      .catch((error: unknown) => { if (!handleUnauthorized(error) && current) setEmployeeSkillsError(true) })
      .finally(() => { if (current) setEmployeeSkillsLoading(false) })
    return () => { current = false }
  }, [handleUnauthorized, selectedEmployeeId])

  useEffect(() => {
    if (!selectedProjectId) return
    let current = true
    getProjectSkills(Number(selectedProjectId))
      .then((items) => { if (current) setProjectSkills(items) })
      .catch((error: unknown) => { if (!handleUnauthorized(error) && current) setProjectSkillsError(true) })
      .finally(() => { if (current) setProjectSkillsLoading(false) })
    return () => { current = false }
  }, [handleUnauthorized, selectedProjectId])

  async function retrySkills() {
    setSkillsLoading(true)
    setSkillsError(false)
    try { setSkills(await getSkills()) } catch (error) {
      if (!handleUnauthorized(error)) setSkillsError(true)
    } finally { setSkillsLoading(false) }
  }

  async function retryEmployees() {
    setEmployeesLoading(true)
    setEmployeesError(false)
    try { setEmployees(await getEmployees()) } catch (error) {
      if (!handleUnauthorized(error)) setEmployeesError(true)
    } finally { setEmployeesLoading(false) }
  }

  async function retryProjects() {
    setProjectsLoading(true)
    setProjectsError(false)
    try { setProjects(await getProjects()) } catch (error) {
      if (!handleUnauthorized(error)) setProjectsError(true)
    } finally { setProjectsLoading(false) }
  }

  async function retryEmployeeSkills() {
    if (!selectedEmployeeId) return
    setEmployeeSkillsLoading(true)
    setEmployeeSkillsError(false)
    try { setEmployeeSkills(await getEmployeeSkills(Number(selectedEmployeeId))) } catch (error) {
      if (!handleUnauthorized(error)) setEmployeeSkillsError(true)
    } finally { setEmployeeSkillsLoading(false) }
  }

  async function retryProjectSkills() {
    if (!selectedProjectId) return
    setProjectSkillsLoading(true)
    setProjectSkillsError(false)
    try { setProjectSkills(await getProjectSkills(Number(selectedProjectId))) } catch (error) {
      if (!handleUnauthorized(error)) setProjectSkillsError(true)
    } finally { setProjectSkillsLoading(false) }
  }

  function selectEmployee(employeeId: string) {
    setSelectedEmployeeId(employeeId)
    setEmployeeSkills([])
    setEmployeeSkillsError(false)
    setEmployeeSkillsLoading(Boolean(employeeId))
  }

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId)
    setProjectSkills([])
    setProjectSkillsError(false)
    setProjectSkillsLoading(Boolean(projectId))
  }

  function openCreateSkill() {
    setEditingSkill(null)
    setSkillName('')
    setSkillFormError(null)
    setSkillFormOpen(true)
  }

  function openRenameSkill(skill: Skill) {
    setEditingSkill(skill)
    setSkillName(skill.name)
    setSkillFormError(null)
    setSkillFormOpen(true)
  }

  function closeSkillForm() {
    setSkillFormOpen(false)
    setEditingSkill(null)
    setSkillName('')
    setSkillFormError(null)
  }

  async function submitSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = skillName.trim()
    if (!name) {
      setSkillFormError(t.skills.nameRequired)
      return
    }
    setSkillSaving(true)
    setSkillFormError(null)
    try {
      if (editingSkill) {
        const updated = await updateSkill(editingSkill.id, { name })
        setSkills((items) => items.map((skill) => skill.id === updated.id ? updated : skill))
        setEmployeeSkills((items) => items.map((item) => item.skill_id === updated.id ? { ...item, skill_name: updated.name } : item))
        setProjectSkills((items) => items.map((item) => item.skill_id === updated.id ? { ...item, skill_name: updated.name } : item))
        setFeedback({ message: formatMessage(t.skills.skillUpdated, { name: updated.name }), error: false })
      } else {
        const created = await createSkill({ name })
        setSkills((items) => [...items, created])
        setFeedback({ message: formatMessage(t.skills.skillCreated, { name: created.name }), error: false })
      }
      closeSkillForm()
    } catch (error) {
      if (handleUnauthorized(error)) return
      setSkillFormError(error instanceof ApiError && error.status === 409
        ? t.skills.duplicateName
        : t.skills.saveSkillError)
    } finally { setSkillSaving(false) }
  }

  async function removeSkill(skill: Skill) {
    if (!window.confirm(formatMessage(t.skills.deleteSkillConfirmation, { name: skill.name }))) return
    setDeletingSkillId(skill.id)
    try {
      await deleteSkill(skill.id)
      setSkills((items) => items.filter((item) => item.id !== skill.id))
      setEmployeeSkills((items) => items.filter((item) => item.skill_id !== skill.id))
      setProjectSkills((items) => items.filter((item) => item.skill_id !== skill.id))
      setFeedback({ message: formatMessage(t.skills.skillDeleted, { name: skill.name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.deleteSkillError, error: true })
    } finally { setDeletingSkillId(null) }
  }

  async function addEmployeeSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedEmployeeId || !employeeSkillId) {
      setFeedback({ message: t.skills.actionRequired, error: true })
      return
    }
    setEmployeeSkillSaving(true)
    try {
      const created = await createEmployeeSkill(Number(selectedEmployeeId), {
        skill_id: Number(employeeSkillId),
        level: employeeSkillLevel,
      })
      setEmployeeSkills((items) => [...items, created])
      setEmployeeSkillId('')
      setEmployeeSkillLevel('BEGINNER')
      setFeedback({ message: formatMessage(t.skills.employeeSkillAdded, { skill: created.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.employeeSkillSaveError, error: true })
    } finally { setEmployeeSkillSaving(false) }
  }

  async function changeEmployeeSkillLevel(item: EmployeeSkill, level: SkillLevel) {
    if (!selectedEmployeeId) return
    setEmployeeSkillSaving(true)
    try {
      const updated = await updateEmployeeSkill(Number(selectedEmployeeId), item.skill_id, { level })
      setEmployeeSkills((items) => items.map((current) => current.skill_id === updated.skill_id ? updated : current))
      setFeedback({ message: formatMessage(t.skills.employeeSkillUpdated, { skill: updated.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.employeeSkillSaveError, error: true })
    } finally { setEmployeeSkillSaving(false) }
  }

  async function removeEmployeeSkill(item: EmployeeSkill) {
    if (!selectedEmployeeId) return
    setEmployeeSkillSaving(true)
    try {
      await deleteEmployeeSkill(Number(selectedEmployeeId), item.skill_id)
      setEmployeeSkills((items) => items.filter((current) => current.skill_id !== item.skill_id))
      setFeedback({ message: formatMessage(t.skills.employeeSkillRemoved, { skill: item.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.employeeSkillDeleteError, error: true })
    } finally { setEmployeeSkillSaving(false) }
  }

  async function addProjectSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProjectId || !projectSkillId) {
      setFeedback({ message: t.skills.actionRequired, error: true })
      return
    }
    setProjectSkillSaving(true)
    try {
      const created = await createProjectSkill(Number(selectedProjectId), {
        skill_id: Number(projectSkillId),
        required_level: projectSkillLevel,
      })
      setProjectSkills((items) => [...items, created])
      setProjectSkillId('')
      setProjectSkillLevel('BEGINNER')
      setFeedback({ message: formatMessage(t.skills.projectSkillAdded, { skill: created.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.projectSkillSaveError, error: true })
    } finally { setProjectSkillSaving(false) }
  }

  async function changeProjectSkillLevel(item: ProjectSkill, requiredLevel: SkillLevel) {
    if (!selectedProjectId) return
    setProjectSkillSaving(true)
    try {
      const updated = await updateProjectSkill(Number(selectedProjectId), item.skill_id, { required_level: requiredLevel })
      setProjectSkills((items) => items.map((current) => current.skill_id === updated.skill_id ? updated : current))
      setFeedback({ message: formatMessage(t.skills.projectSkillUpdated, { skill: updated.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.projectSkillSaveError, error: true })
    } finally { setProjectSkillSaving(false) }
  }

  async function removeProjectSkill(item: ProjectSkill) {
    if (!selectedProjectId) return
    setProjectSkillSaving(true)
    try {
      await deleteProjectSkill(Number(selectedProjectId), item.skill_id)
      setProjectSkills((items) => items.filter((current) => current.skill_id !== item.skill_id))
      setFeedback({ message: formatMessage(t.skills.projectSkillRemoved, { skill: item.skill_name }), error: false })
    } catch (error) {
      if (!handleUnauthorized(error)) setFeedback({ message: t.skills.projectSkillDeleteError, error: true })
    } finally { setProjectSkillSaving(false) }
  }

  const availableEmployeeSkills = skills.filter((skill) => !employeeSkills.some((item) => item.skill_id === skill.id))
  const availableProjectSkills = skills.filter((skill) => !projectSkills.some((item) => item.skill_id === skill.id))

  return (
    <div className="page skills-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.skills.eyebrow}</p>
          <h2>{t.skills.title}</h2>
          <p>{t.skills.description}</p>
        </div>
      </section>

      {feedback && (
        <div className={`skills-page__feedback${feedback.error ? ' skills-page__feedback--error' : ''}`} role={feedback.error ? 'alert' : 'status'}>
          <span>{feedback.message}</span>
          <button type="button" aria-label={t.skills.dismissFeedback} onClick={() => setFeedback(null)}>×</button>
        </div>
      )}

      <section className="data-card skills-catalog" aria-labelledby="skills-catalog-heading">
        <div className="data-card__header">
          <div><h3 id="skills-catalog-heading">{t.skills.catalog}</h3><p>{t.skills.catalogDescription}</p></div>
          <div className="skills-card__header-actions">
            <span>{formatMessage(t.skills.skillCount, { count: skills.length })}</span>
            {canManage && <button className="skills-page__button skills-page__button--primary" type="button" onClick={openCreateSkill}>{t.skills.createSkill}</button>}
          </div>
        </div>
        {skillFormOpen && canManage && (
          <form className="skill-form" onSubmit={submitSkill} noValidate>
            <label><span>{editingSkill ? t.skills.renameSkill : t.skills.skillName}</span><input autoFocus value={skillName} disabled={skillSaving} onChange={(event) => setSkillName(event.target.value)} /></label>
            <div className="skill-form__actions">
              <button className="skills-page__button skills-page__button--primary" type="submit" disabled={skillSaving}>{skillSaving ? t.skills.saving : t.skills.saveSkill}</button>
              <button className="skills-page__button" type="button" disabled={skillSaving} onClick={closeSkillForm}>{t.skills.cancel}</button>
            </div>
            {skillFormError && <p role="alert">{skillFormError}</p>}
          </form>
        )}
        {skillsLoading && <div className="skills-page__state" role="status">{t.skills.loadingCatalog}</div>}
        {!skillsLoading && skillsError && <div className="skills-page__state" role="alert"><strong>{t.skills.catalogLoadError}</strong><button className="skills-page__button" type="button" onClick={retrySkills}>{t.skills.retry}</button></div>}
        {!skillsLoading && !skillsError && skills.length === 0 && <div className="skills-page__state"><strong>{t.skills.emptyCatalog}</strong><span>{t.skills.emptyCatalogDescription}</span></div>}
        {!skillsLoading && !skillsError && skills.length > 0 && (
          <ul className="skill-list">
            {skills.map((skill) => <li key={skill.id}><strong>{skill.name}</strong>{canManage && <div><button type="button" onClick={() => openRenameSkill(skill)}>{t.skills.edit}</button><button className="skill-list__delete" type="button" disabled={deletingSkillId === skill.id} onClick={() => removeSkill(skill)}>{deletingSkillId === skill.id ? t.skills.deleting : t.skills.delete}</button></div>}</li>)}
          </ul>
        )}
      </section>

      <div className="skills-page__relations">
        <section className="data-card skills-card" aria-labelledby="employee-skills-heading">
          <div className="data-card__header"><div><h3 id="employee-skills-heading">{t.skills.employeeSkills}</h3><p>{t.skills.employeeSkillsDescription}</p></div></div>
          <div className="skills-card__body">
            <label className="skills-card__selector"><span>{t.skills.employee}</span><select value={selectedEmployeeId} disabled={employeesLoading || employeesError} onChange={(event) => selectEmployee(event.target.value)}><option value="">{employeesLoading ? t.skills.loadingEmployees : t.skills.selectEmployee}</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}</option>)}</select></label>
            {employeesError && <div className="skills-card__notice" role="alert"><span>{t.skills.employeesLoadError}</span><button type="button" onClick={retryEmployees}>{t.skills.retryEmployees}</button></div>}
            {!selectedEmployeeId && !employeesError && <p className="skills-card__prompt">{t.skills.selectEmployeePrompt}</p>}
            {selectedEmployeeId && employeeSkillsLoading && <div className="skills-card__state" role="status">{t.skills.loadingEmployeeSkills}</div>}
            {selectedEmployeeId && !employeeSkillsLoading && employeeSkillsError && <div className="skills-card__state" role="alert"><strong>{t.skills.employeeSkillsLoadError}</strong><button className="skills-page__button" type="button" onClick={retryEmployeeSkills}>{t.skills.retry}</button></div>}
            {selectedEmployeeId && !employeeSkillsLoading && !employeeSkillsError && employeeSkills.length === 0 && <p className="skills-card__prompt">{t.skills.emptyEmployeeSkills}</p>}
            {selectedEmployeeId && !employeeSkillsLoading && !employeeSkillsError && employeeSkills.length > 0 && <ul className="association-list">{employeeSkills.map((item) => <li key={item.skill_id}><strong>{item.skill_name}</strong>{canManage ? <div><label className="sr-only" htmlFor={`employee-skill-${item.skill_id}`}>{formatMessage(t.skills.changeEmployeeLevel, { skill: item.skill_name })}</label><select id={`employee-skill-${item.skill_id}`} value={item.level} disabled={employeeSkillSaving} onChange={(event) => changeEmployeeSkillLevel(item, event.target.value as SkillLevel)}>{skillLevels.map((level) => <option key={level} value={level}>{t.skills.levels[level]}</option>)}</select><button type="button" disabled={employeeSkillSaving} onClick={() => removeEmployeeSkill(item)}>{t.skills.removeEmployeeSkill}</button></div> : <span className="skill-level">{t.skills.levels[item.level]}</span>}</li>)}</ul>}
            {selectedEmployeeId && canManage && !employeeSkillsError && <form className="association-form" onSubmit={addEmployeeSkill}><select aria-label={t.skills.assignSkill} value={employeeSkillId} disabled={employeeSkillSaving || skillsLoading || skillsError || availableEmployeeSkills.length === 0} onChange={(event) => setEmployeeSkillId(event.target.value)}><option value="">{availableEmployeeSkills.length === 0 ? t.skills.allSkillsAssigned : t.skills.selectSkill}</option>{availableEmployeeSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select><select aria-label={t.skills.level} value={employeeSkillLevel} disabled={employeeSkillSaving} onChange={(event) => setEmployeeSkillLevel(event.target.value as SkillLevel)}>{skillLevels.map((level) => <option key={level} value={level}>{t.skills.levels[level]}</option>)}</select><button className="skills-page__button skills-page__button--primary" type="submit" disabled={employeeSkillSaving || !employeeSkillId}>{employeeSkillSaving ? t.skills.adding : t.skills.addSkill}</button></form>}
          </div>
        </section>

        <section className="data-card skills-card" aria-labelledby="project-skills-heading">
          <div className="data-card__header"><div><h3 id="project-skills-heading">{t.skills.projectRequirements}</h3><p>{t.skills.projectRequirementsDescription}</p></div></div>
          <div className="skills-card__body">
            <label className="skills-card__selector"><span>{t.skills.project}</span><select value={selectedProjectId} disabled={projectsLoading || projectsError} onChange={(event) => selectProject(event.target.value)}><option value="">{projectsLoading ? t.skills.loadingProjects : t.skills.selectProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            {projectsError && <div className="skills-card__notice" role="alert"><span>{t.skills.projectsLoadError}</span><button type="button" onClick={retryProjects}>{t.skills.retryProjects}</button></div>}
            {!selectedProjectId && !projectsError && <p className="skills-card__prompt">{t.skills.selectProjectPrompt}</p>}
            {selectedProjectId && projectSkillsLoading && <div className="skills-card__state" role="status">{t.skills.loadingProjectSkills}</div>}
            {selectedProjectId && !projectSkillsLoading && projectSkillsError && <div className="skills-card__state" role="alert"><strong>{t.skills.projectSkillsLoadError}</strong><button className="skills-page__button" type="button" onClick={retryProjectSkills}>{t.skills.retry}</button></div>}
            {selectedProjectId && !projectSkillsLoading && !projectSkillsError && projectSkills.length === 0 && <p className="skills-card__prompt">{t.skills.emptyProjectSkills}</p>}
            {selectedProjectId && !projectSkillsLoading && !projectSkillsError && projectSkills.length > 0 && <ul className="association-list">{projectSkills.map((item) => <li key={item.skill_id}><strong>{item.skill_name}</strong>{canManage ? <div><label className="sr-only" htmlFor={`project-skill-${item.skill_id}`}>{formatMessage(t.skills.changeRequiredLevel, { skill: item.skill_name })}</label><select id={`project-skill-${item.skill_id}`} value={item.required_level} disabled={projectSkillSaving} onChange={(event) => changeProjectSkillLevel(item, event.target.value as SkillLevel)}>{skillLevels.map((level) => <option key={level} value={level}>{t.skills.levels[level]}</option>)}</select><button type="button" disabled={projectSkillSaving} onClick={() => removeProjectSkill(item)}>{t.skills.removeProjectSkill}</button></div> : <span className="skill-level">{t.skills.levels[item.required_level]}</span>}</li>)}</ul>}
            {selectedProjectId && canManage && !projectSkillsError && <form className="association-form" onSubmit={addProjectSkill}><select aria-label={t.skills.addRequirement} value={projectSkillId} disabled={projectSkillSaving || skillsLoading || skillsError || availableProjectSkills.length === 0} onChange={(event) => setProjectSkillId(event.target.value)}><option value="">{availableProjectSkills.length === 0 ? t.skills.allSkillsRequired : t.skills.selectSkill}</option>{availableProjectSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select><select aria-label={t.skills.requiredLevel} value={projectSkillLevel} disabled={projectSkillSaving} onChange={(event) => setProjectSkillLevel(event.target.value as SkillLevel)}>{skillLevels.map((level) => <option key={level} value={level}>{t.skills.levels[level]}</option>)}</select><button className="skills-page__button skills-page__button--primary" type="submit" disabled={projectSkillSaving || !projectSkillId}>{projectSkillSaving ? t.skills.adding : t.skills.addRequirement}</button></form>}
          </div>
        </section>
      </div>
    </div>
  )
}
