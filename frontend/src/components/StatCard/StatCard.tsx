import type { DashboardStatistic } from '@/types/domain'
import { useLanguage } from '@/i18n/useLanguage'
import './StatCard.scss'

interface StatCardProps {
  statistic: DashboardStatistic
}

export function StatCard({ statistic }: StatCardProps) {
  const { language, t } = useLanguage()
  const copy = t.dashboard.metrics[statistic.id]

  return (
    <article className="stat-card">
      <p>{copy.label}</p>
      <strong>{statistic.value.toLocaleString(language)}{statistic.id === 'assigned' ? '%' : ''}</strong>
      <span>{copy.detail}</span>
    </article>
  )
}
