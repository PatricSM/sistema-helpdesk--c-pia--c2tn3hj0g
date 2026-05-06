import pb from '@/lib/pocketbase/client'

export interface TeamRecord {
  id: string
  name: string
  description?: string
  color?: string
  created: string
  updated: string
}

export interface TeamMemberRecord {
  id: string
  team: string
  user: string
  role?: 'member' | 'lead'
  created: string
  expand?: {
    team?: TeamRecord
    user?: { id: string; name: string; email: string; role?: string }
  }
}

export const getTeams = () => pb.collection('teams').getFullList<TeamRecord>({ sort: 'name' })

export const getTeam = (id: string) => pb.collection('teams').getOne<TeamRecord>(id)

export const createTeam = (data: Partial<TeamRecord>) =>
  pb.collection('teams').create<TeamRecord>(data)

export const updateTeam = (id: string, data: Partial<TeamRecord>) =>
  pb.collection('teams').update<TeamRecord>(id, data)

export const deleteTeam = (id: string) => pb.collection('teams').delete(id)

export const getTeamMembers = (teamId: string) =>
  pb
    .collection('team_members')
    .getFullList<TeamMemberRecord>({ filter: `team="${teamId}"`, expand: 'user' })

export const addTeamMember = (data: { team: string; user: string; role?: 'member' | 'lead' }) =>
  pb.collection('team_members').create<TeamMemberRecord>(data)

export const removeTeamMember = (id: string) => pb.collection('team_members').delete(id)
