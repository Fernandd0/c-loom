import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { boardFromRow } from './mappers'

export const createWorkspace = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  name: string
) => {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({ user_id: userId, name })
    .select()
    .single()

  if (error) {
    console.error('Error creating workspace:', error)
    return null
  }
  return boardFromRow(data)
}

export const deleteWorkspace = async (
  supabase: SupabaseClient<Database>,
  workspaceId: string
) => {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) {
    console.error('Error deleting workspace:', error)
    return false
  }
  return true
}

export const updateWorkspace = async (
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  name: string
) => {
  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId)

  if (error) {
    console.error('Error updating workspace:', error)
    return false
  }
  return true
}
