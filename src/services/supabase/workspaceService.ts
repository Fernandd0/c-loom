import { SupabaseClient } from '@supabase/supabase-js'
import { Board } from '@/app/types'

export const createWorkspace = async (
  supabase: SupabaseClient,
  userId: string,
  name: string
) => {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ user_id: userId, name })
      .select()
      .single()

    if (error) {
      console.error('Error creating workspace:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      userId: data.user_id,
      createdAt: data.created_at,
      tasks: [],
    }
  } catch (error) {
    console.error('Unexpected error creating workspace:', error)
    return null
  }
}

export const deleteWorkspace = async (
  supabase: SupabaseClient,
  workspaceId: string
) => {
  try {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) {
      console.error('Error deleting workspace:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error deleting workspace:', error)
    return false
  }
}

export const updateWorkspace = async (
  supabase: SupabaseClient,
  workspaceId: string,
  name: string
) => {
  try {
    const { error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', workspaceId)

    if (error) {
      console.error('Error updating workspace:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error updating workspace:', error)
    return false
  }
}
