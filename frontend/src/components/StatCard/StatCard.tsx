import { useLanguage } from '@/i18n/useLanguage'
import './StatCard.scss'

interface StatCardProps {
  label: string
  value: number
  detail: string
}

export function StatCard({ label, value, detail }: StatCardProps) {
  const { language } = useLanguage()

  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value.toLocaleString(language)}</strong>
      <span>{detail}</span>
    </article>
  )
}
