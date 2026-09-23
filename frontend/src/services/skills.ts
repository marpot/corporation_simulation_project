import { authenticatedRequest } from './api'
import type {
  EmployeeSkill,
  EmployeeSkillCreate,
  EmployeeSkillUpdate,
  ProjectSkill,
  ProjectSkillCreate,
  ProjectSkillUpdate,
  Skill,
  SkillCreate,
  SkillUpdate,
} from '@/types/skill'

export function getSkills(): Promise<Skill[]> {
  return authenticatedRequest<Skill[]>('/skills')
}

export function createSkill(skill: SkillCreate): Promise<Skill> {
  return authenticatedRequest<Skill>('/skills', {
    method: 'POST',
    body: JSON.stringify(skill),
  })
}

export function updateSkill(skillId: number, skill: SkillUpdate): Promise<Skill> {
  return authenticatedRequest<Skill>(`/skills/${skillId}`, {
    method: 'PATCH',
    body: JSON.stringify(skill),
  })
}

export function deleteSkill(skillId: number): Promise<void> {
  return authenticatedRequest<void>(`/skills/${skillId}`, { method: 'DELETE' })
}

export function getEmployeeSkills(employeeId: number): Promise<EmployeeSkill[]> {
  return authenticatedRequest<EmployeeSkill[]>(`/employees/${employeeId}/skills`)
}

export function createEmployeeSkill(
  employeeId: number,
  employeeSkill: EmployeeSkillCreate,
): Promise<EmployeeSkill> {
  return authenticatedRequest<EmployeeSkill>(`/employees/${employeeId}/skills`, {
    method: 'POST',
    body: JSON.stringify(employeeSkill),
  })
}

export function updateEmployeeSkill(
  employeeId: number,
  skillId: number,
  employeeSkill: EmployeeSkillUpdate,
): Promise<EmployeeSkill> {
  return authenticatedRequest<EmployeeSkill>(`/employees/${employeeId}/skills/${skillId}`, {
    method: 'PATCH',
    body: JSON.stringify(employeeSkill),
  })
}

export function deleteEmployeeSkill(employeeId: number, skillId: number): Promise<void> {
  return authenticatedRequest<void>(`/employees/${employeeId}/skills/${skillId}`, {
    method: 'DELETE',
  })
}

export function getProjectSkills(projectId: number): Promise<ProjectSkill[]> {
  return authenticatedRequest<ProjectSkill[]>(`/projects/${projectId}/skills`)
}

export function createProjectSkill(
  projectId: number,
  projectSkill: ProjectSkillCreate,
): Promise<ProjectSkill> {
  return authenticatedRequest<ProjectSkill>(`/projects/${projectId}/skills`, {
    method: 'POST',
    body: JSON.stringify(projectSkill),
  })
}

export function updateProjectSkill(
  projectId: number,
  skillId: number,
  projectSkill: ProjectSkillUpdate,
): Promise<ProjectSkill> {
  return authenticatedRequest<ProjectSkill>(`/projects/${projectId}/skills/${skillId}`, {
    method: 'PATCH',
    body: JSON.stringify(projectSkill),
  })
}

export function deleteProjectSkill(projectId: number, skillId: number): Promise<void> {
  return authenticatedRequest<void>(`/projects/${projectId}/skills/${skillId}`, {
    method: 'DELETE',
  })
}
