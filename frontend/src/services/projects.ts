import { authenticatedRequest } from './api'
import type { Project, ProjectCreate, ProjectUpdate } from '@/types/project'

export function getProjects(): Promise<Project[]> {
  return authenticatedRequest<Project[]>('/projects')
}

export function createProject(project: ProjectCreate): Promise<Project> {
  return authenticatedRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  })
}

export function updateProject(projectId: number, project: ProjectUpdate): Promise<Project> {
  return authenticatedRequest<Project>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(project),
  })
}

export function deleteProject(projectId: number): Promise<void> {
  return authenticatedRequest<void>(`/projects/${projectId}`, { method: 'DELETE' })
}
