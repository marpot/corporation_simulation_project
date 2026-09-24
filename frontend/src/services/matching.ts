import { authenticatedRequest } from './api'
import type { EmployeeProjectMatch } from '@/types/matching'

export function getProjectMatches(
  projectId: number,
  date?: string,
): Promise<EmployeeProjectMatch[]> {
  const query = date ? `?${new URLSearchParams({ date }).toString()}` : ''
  return authenticatedRequest<EmployeeProjectMatch[]>(`/projects/${projectId}/matching${query}`)
}
