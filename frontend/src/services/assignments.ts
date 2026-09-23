import { authenticatedRequest } from './api'
import type { Assignment, AssignmentCreate, AssignmentUpdate } from '../types/assignment'

export function getAssignments(): Promise<Assignment[]> {
  return authenticatedRequest<Assignment[]>('/assignments')
}

export function createAssignment(assignment: AssignmentCreate): Promise<Assignment> {
  return authenticatedRequest<Assignment>('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignment),
  })
}

export function updateAssignment(
  assignmentId: number,
  assignment: AssignmentUpdate,
): Promise<Assignment> {
  return authenticatedRequest<Assignment>(`/assignments/${assignmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(assignment),
  })
}

export function deleteAssignment(assignmentId: number): Promise<void> {
  return authenticatedRequest<void>(`/assignments/${assignmentId}`, { method: 'DELETE' })
}
