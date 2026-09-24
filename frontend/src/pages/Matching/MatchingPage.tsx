import { useEffect, useState } from 'react'
import { useUnauthorizedHandler } from '@/auth/useUnauthorizedHandler'
import { useLanguage } from '@/i18n/useLanguage'
import { formatMessage } from '@/i18n/translations'
import { getProjectMatches } from '@/services/matching'
import { getProjects } from '@/services/projects'
import type { EmployeeProjectMatch, SkillRequirementMatch } from '@/types/matching'
import type { Project } from '@/types/project'
import './MatchingPage.scss'

export function MatchingPage() {
  const handleUnauthorized = useUnauthorizedHandler()
  const { t } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(false)
  const [projectsReloadKey, setProjectsReloadKey] = useState(0)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [matches, setMatches] = useState<EmployeeProjectMatch[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState(false)
  const [matchesReloadKey, setMatchesReloadKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    getProjects()
      .then((items) => {
        if (isCurrent) setProjects(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setProjectsError(true)
      })
      .finally(() => {
        if (isCurrent) setProjectsLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized, projectsReloadKey])

  useEffect(() => {
    if (!selectedProjectId) return
    let isCurrent = true
    getProjectMatches(Number(selectedProjectId), targetDate || undefined)
      .then((items) => {
        if (isCurrent) setMatches(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setMatchesError(true)
      })
      .finally(() => {
        if (isCurrent) setMatchesLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized, matchesReloadKey, selectedProjectId, targetDate])

  function retryProjects() {
    setProjects([])
    setProjectsError(false)
    setProjectsLoading(true)
    setProjectsReloadKey((current) => current + 1)
  }

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId)
    setMatches([])
    setMatchesError(false)
    setMatchesLoading(Boolean(projectId))
  }

  function changeTargetDate(date: string) {
    setTargetDate(date)
    if (selectedProjectId) {
      setMatches([])
      setMatchesError(false)
      setMatchesLoading(true)
    }
  }

  function retryMatches() {
    setMatches([])
    setMatchesError(false)
    setMatchesLoading(true)
    setMatchesReloadKey((current) => current + 1)
  }

  function requirementItem(requirement: SkillRequirementMatch) {
    return (
      <li key={requirement.skill_id} className={requirement.met ? 'requirement requirement--met' : 'requirement requirement--unmet'}>
        <div>
          <strong>{requirement.skill_name}</strong>
          <span>{formatMessage(t.matching.requiredLevel, { level: t.skills.levels[requirement.required_level] })}</span>
          <span>
            {requirement.employee_level
              ? formatMessage(t.matching.employeeLevel, { level: t.skills.levels[requirement.employee_level] })
              : t.matching.missingSkill}
          </span>
        </div>
        <span className="requirement__result">{requirement.met ? t.matching.satisfied : t.matching.notSatisfied}</span>
      </li>
    )
  }

  const hasNoRequirements = matches.length > 0
    && matches.every((match) => match.requirements_total === 0)

  return (
    <div className="page matching-page">
      <section className="page-heading">
        <div>
          <p className="page-heading__eyebrow">{t.matching.eyebrow}</p>
          <h2>{t.matching.title}</h2>
          <p>{t.matching.description}</p>
        </div>
      </section>

      <section className="data-card matching-controls" aria-labelledby="matching-controls-heading">
        <div className="data-card__header">
          <div>
            <h3 id="matching-controls-heading">{t.matching.controls}</h3>
            <p>{t.matching.controlsDescription}</p>
          </div>
        </div>
        <div className="matching-controls__fields">
          <label>
            <span>{t.matching.project}</span>
            <select
              value={selectedProjectId}
              disabled={projectsLoading || projectsError || projects.length === 0}
              onChange={(event) => selectProject(event.target.value)}
            >
              <option value="">
                {projectsLoading
                  ? t.matching.loadingProjects
                  : projects.length === 0 ? t.matching.projectsEmpty : t.matching.selectProject}
              </option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label>
            <span>{t.matching.targetDate}</span>
            <input
              type="date"
              value={targetDate}
              aria-label={t.matching.targetDate}
              aria-describedby="matching-date-hint"
              onChange={(event) => changeTargetDate(event.target.value)}
            />
            <small id="matching-date-hint">{t.matching.optionalDate}</small>
          </label>
        </div>
        {projectsError && (
          <div className="matching-controls__error" role="alert">
            <span><strong>{t.matching.projectsLoadError}</strong>{t.matching.projectsLoadErrorDescription}</span>
            <button type="button" onClick={retryProjects}>{t.matching.retryProjects}</button>
          </div>
        )}
      </section>

      {!selectedProjectId && !projectsError && (
        <section className="data-card matching-page__state">
          <strong>{t.matching.selectPromptTitle}</strong>
          <span>{t.matching.selectPromptDescription}</span>
        </section>
      )}

      {selectedProjectId && matchesLoading && (
        <section className="data-card matching-page__state" role="status">{t.matching.loading}</section>
      )}

      {selectedProjectId && !matchesLoading && matchesError && (
        <section className="data-card matching-page__state" role="alert">
          <strong>{t.matching.loadError}</strong>
          <span>{t.matching.loadErrorDescription}</span>
          <button type="button" onClick={retryMatches}>{t.matching.retry}</button>
        </section>
      )}

      {selectedProjectId && !matchesLoading && !matchesError && matches.length === 0 && (
        <section className="data-card matching-page__state">
          <strong>{t.matching.emptyTitle}</strong>
          <span>{t.matching.emptyDescription}</span>
        </section>
      )}

      {selectedProjectId && !matchesLoading && !matchesError && matches.length > 0 && (
        <section aria-labelledby="matching-results-heading">
          <div className="matching-results__heading">
            <div>
              <h3 id="matching-results-heading">{t.matching.results}</h3>
              <p>{t.matching.resultsDescription}</p>
            </div>
          </div>

          {hasNoRequirements && (
            <div className="matching-results__notice" role="note">
              <strong>{t.matching.noRequirementsTitle}</strong>
              <span>{t.matching.noRequirementsDescription}</span>
            </div>
          )}

          <ol className="matching-results">
            {matches.map((match, index) => (
              <li key={match.employee_id} data-testid="matching-candidate">
                <article
                  className="match-card"
                  aria-label={formatMessage(t.matching.candidateLabel, {
                    rank: index + 1,
                    employee: match.employee_name,
                  })}
                >
                  <div className="match-card__header">
                    <span className="match-card__rank">{formatMessage(t.matching.rank, { rank: index + 1 })}</span>
                    <h4>{match.employee_name}</h4>
                    <span className={`match-capacity-status match-capacity-status--${match.capacity_status.toLowerCase().replace('_', '-')}`}>
                      {t.capacity.statuses[match.capacity_status]}
                    </span>
                  </div>
                  <dl className="match-card__metrics">
                    <div><dt>{t.matching.requirements}</dt><dd>{formatMessage(t.matching.requirementsCount, { met: match.requirements_met, total: match.requirements_total })}</dd></div>
                    <div><dt>{t.matching.allocated}</dt><dd>{match.allocated_percent}%</dd></div>
                    <div><dt>{t.matching.available}</dt><dd>{match.available_percent}%</dd></div>
                    <div><dt>{t.matching.status}</dt><dd>{t.capacity.statuses[match.capacity_status]}</dd></div>
                  </dl>

                  {!hasNoRequirements && (
                    <div className="match-card__requirements">
                      <section>
                        <h5>{t.matching.matchedRequirements}</h5>
                        {match.matched_requirements.length > 0
                          ? <ul>{match.matched_requirements.map(requirementItem)}</ul>
                          : <p>{t.matching.noneMatched}</p>}
                      </section>
                      <section>
                        <h5>{t.matching.unmetRequirements}</h5>
                        {match.unmet_requirements.length > 0
                          ? <ul>{match.unmet_requirements.map(requirementItem)}</ul>
                          : <p>{t.matching.noneUnmet}</p>}
                      </section>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
