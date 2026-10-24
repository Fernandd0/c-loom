import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { Task } from '@/app/types'
import { taskToInsert, taskToUpdate } from './mappers'

export const createTask = async (
  supabase: SupabaseClient<Database>,
  task: Task
) => {
  const { error } = await supabase.from('tasks').insert(taskToInsert(task))

  if (error) {
    console.error('Error creating task:', error)
    return false
  }
  return true
}

export const updateTask = async (
  supabase: SupabaseClient<Database>,
  taskId: string,
  updates: Partial<Task>
) => {
  const { error } = await supabase
    .from('tasks')
    .update(taskToUpdate(updates))
    .eq('id', taskId)

  if (error) {
    console.error('Error updating task:', error)
    return false
  }
  return true
}

export const deleteTask = async (
  supabase: SupabaseClient<Database>,
  taskId: string
) => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    return false
  }
  return true
}
