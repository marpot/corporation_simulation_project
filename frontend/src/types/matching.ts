import type { CapacityStatus } from '@/types/capacity'
import type { SkillLevel } from '@/types/skill'

export interface SkillRequirementMatch {
  skill_id: number
  skill_name: string
  required_level: SkillLevel
  employee_level: SkillLevel | null
  met: boolean
}

export interface EmployeeProjectMatch {
  employee_id: number
  employee_name: string
  requirements_met: number
  requirements_total: number
  matched_requirements: SkillRequirementMatch[]
  unmet_requirements: SkillRequirementMatch[]
  allocated_percent: number
  available_percent: number
  capacity_status: CapacityStatus
}
