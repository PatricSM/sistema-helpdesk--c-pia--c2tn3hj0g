import pb from '@/lib/pocketbase/client'

export interface AssignmentRuleRecord {
  id: string
  name: string
  description?: string
  condition_priority?: 'low' | 'medium' | 'high' | 'urgent'
  condition_category?: string
  assign_to_team?: string
  assign_to_user?: string
  priority_order?: number
  is_active?: boolean
  created: string
  updated: string
  expand?: {
    condition_category?: { id: string; name: string }
    assign_to_team?: { id: string; name: string; color?: string }
    assign_to_user?: { id: string; name: string; email: string }
  }
}

export const getAssignmentRules = () =>
  pb.collection('assignment_rules').getFullList<AssignmentRuleRecord>({
    sort: 'priority_order,name',
    expand: 'condition_category,assign_to_team,assign_to_user',
  })

export const createAssignmentRule = (data: Partial<AssignmentRuleRecord>) =>
  pb.collection('assignment_rules').create<AssignmentRuleRecord>(data)

export const updateAssignmentRule = (id: string, data: Partial<AssignmentRuleRecord>) =>
  pb.collection('assignment_rules').update<AssignmentRuleRecord>(id, data)

export const deleteAssignmentRule = (id: string) => pb.collection('assignment_rules').delete(id)
