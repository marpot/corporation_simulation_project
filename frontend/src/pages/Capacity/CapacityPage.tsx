import { useEffect, useMemo, useState } from 'react'
import { useUnauthorizedHandler } from '@/auth/useUnauthorizedHandler'
import { useLanguage } from '@/i18n/useLanguage'
import { getEmployeeCapacities } from '@/services/capacity'
import type { CapacityStatus, EmployeeCapacity } from '@/types/capacity'
import './CapacityPage.scss'

function todayAsLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function CapacityPage() {
  const handleUnauthorized = useUnauthorizedHandler()
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState(todayAsLocalDate)
  const [capacities, setCapacities] = useState<EmployeeCapacity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrent = true
    getEmployeeCapacities(selectedDate)
      .then((items) => {
        if (isCurrent) setCapacities(items)
      })
      .catch((error: unknown) => {
        if (!handleUnauthorized(error) && isCurrent) setLoadError(true)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [handleUnauthorized, reloadKey, selectedDate])

  const summary = useMemo(() => ({
    employees: capacities.length,
    available: capacities.filter((item) => item.status === 'AVAILABLE').length,
    fullyAllocated: capacities.filter((item) => item.status === 'FULLY_ALLOCATED').length,
    overallocated: capacities.filter((item) => item.status === 'OVERALLOCATED').length,
  }), [capacities])

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setCapacities([])
    setLoadError(false)
    setIsLoading(true)
  }

  function handleRetry() {
    setCapacities([])
    setLoadError(false)
    setIsLoading(true)
    setReloadKey((current) => current + 1)
  }

  function statusLabel(status: CapacityStatus): string {
    return t.capacity.statuses[status]
  }

  return (
    <div className="page capacity-page">
      <section className="page-heading capacity-page__heading">
        <div>
          <p className="page-heading__eyebrow">{t.capacity.eyebrow}</p>
          <h2>{t.capacity.title}</h2>
          <p>{t.capacity.description}</p>
        </div>
        <label className="capacity-date">
          <span>{t.capacity.selectedDate}</span>
          <input
            type="date"
            required
            value={selectedDate}
            aria-label={t.capacity.selectedDate}
            onChange={(event) => {
              if (event.target.value) handleDateChange(event.target.value)
            }}
          />
        </label>
      </section>

      {!isLoading && !loadError && (
        <section className="capacity-summary" aria-label={t.capacity.summaryLabel}>
          <article className="capacity-summary__item">
            <span>{t.capacity.employees}</span>
            <strong>{summary.employees}</strong>
          </article>
          <article className="capacity-summary__item capacity-summary__item--available">
            <span>{t.capacity.available}</span>
            <strong>{summary.available}</strong>
          </article>
          <article className="capacity-summary__item capacity-summary__item--full">
            <span>{t.capacity.fullyAllocated}</span>
            <strong>{summary.fullyAllocated}</strong>
          </article>
          <article className="capacity-summary__item capacity-summary__item--overallocated">
            <span>{t.capacity.overallocated}</span>
            <strong>{summary.overallocated}</strong>
          </article>
        </section>
      )}

      <section className="data-card capacity-register" aria-labelledby="capacity-table-heading">
        <div className="data-card__header">
          <div>
            <h3 id="capacity-table-heading">{t.capacity.register}</h3>
            <p>{t.capacity.registerDescription}</p>
          </div>
        </div>

        {isLoading && <div className="capacity-page__state" role="status">{t.capacity.loading}</div>}

        {!isLoading && loadError && (
          <div className="capacity-page__state" role="alert">
            <strong>{t.capacity.loadError}</strong>
            <span>{t.capacity.loadErrorDescription}</span>
            <button type="button" onClick={handleRetry}>{t.capacity.retry}</button>
          </div>
        )}

        {!isLoading && !loadError && capacities.length === 0 && (
          <div className="capacity-page__state">
            <strong>{t.capacity.emptyTitle}</strong>
            <span>{t.capacity.emptyDescription}</span>
          </div>
        )}

        {!isLoading && !loadError && capacities.length > 0 && (
          <div className="table-scroll">
            <table className="capacity-table">
              <thead>
                <tr>
                  <th scope="col">{t.capacity.employee}</th>
                  <th scope="col">{t.capacity.allocated}</th>
                  <th scope="col">{t.capacity.availableCapacity}</th>
                  <th scope="col">{t.capacity.status}</th>
                </tr>
              </thead>
              <tbody>
                {capacities.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td data-label={t.capacity.employee}>
                      <strong className="table-primary">{employee.employee_name}</strong>
                    </td>
                    <td data-label={t.capacity.allocated}>
                      <strong className="capacity-table__percent">{employee.allocated_percent}%</strong>
                    </td>
                    <td data-label={t.capacity.availableCapacity}>{employee.available_percent}%</td>
                    <td data-label={t.capacity.status}>
                      <span className={`capacity-status capacity-status--${employee.status.toLowerCase().replace('_', '-')}`}>
                        {statusLabel(employee.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
