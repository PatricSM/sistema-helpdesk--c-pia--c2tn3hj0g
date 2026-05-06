import pb from '@/lib/pocketbase/client'

export interface SettingRecord {
  id: string
  key: string
  value: unknown
  created: string
  updated: string
}

export const getSettings = () =>
  pb.collection('settings').getFullList<SettingRecord>({ sort: 'key' })

export const getSetting = async (key: string): Promise<unknown> => {
  try {
    const r = await pb.collection('settings').getFirstListItem<SettingRecord>(`key="${key}"`)
    return r.value
  } catch {
    return undefined
  }
}

export const upsertSetting = async (key: string, value: unknown) => {
  try {
    const existing = await pb.collection('settings').getFirstListItem<SettingRecord>(`key="${key}"`)
    return pb.collection('settings').update<SettingRecord>(existing.id, { value })
  } catch {
    return pb.collection('settings').create<SettingRecord>({ key, value })
  }
}

export const deleteSetting = async (key: string) => {
  try {
    const existing = await pb.collection('settings').getFirstListItem<SettingRecord>(`key="${key}"`)
    await pb.collection('settings').delete(existing.id)
  } catch {
    // already gone
  }
}
