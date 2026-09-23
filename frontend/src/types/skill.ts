export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'

export interface Skill {
  id: number
  name: string
}

export interface SkillCreate {
  name: string
}

export type SkillUpdate = Partial<SkillCreate>

export interface EmployeeSkill {
  skill_id: number
  skill_name: string
  level: SkillLevel
}

export interface EmployeeSkillCreate {
  skill_id: number
  level: SkillLevel
}

export interface EmployeeSkillUpdate {
  level: SkillLevel
}

export interface ProjectSkill {
  skill_id: number
  skill_name: string
  required_level: SkillLevel
}

export interface ProjectSkillCreate {
  skill_id: number
  required_level: SkillLevel
}

export interface ProjectSkillUpdate {
  required_level: SkillLevel
}
