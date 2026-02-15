import { SupabaseClient } from '@supabase/supabase-js'
import { Task } from '@/app/types'

export const createTask = async (
  supabase: SupabaseClient,
  task: Task
) => {
  try {
    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      workspace_id: task.workspaceId,
      title: task.title,
      description: task.description,
      pos_x: task.pos_x,
      pos_y: task.pos_y,
      completed: task.completed,
      deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
      category_id: task.categoryId === 'default' ? null : task.categoryId,
      created_at: task.createdAt,
    })

    if (error) {
      console.error('Error creating task:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error creating task:', error)
    return false
  }
}

export const updateTask = async (
  supabase: SupabaseClient,
  task: Task
) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        description: task.description,
        pos_x: task.pos_x,
        pos_y: task.pos_y,
        completed: task.completed,
        deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
        category_id: task.categoryId === 'default' ? null : task.categoryId,
        completed_at: task.completed ? new Date().toISOString() : null,
      })
      .eq('id', task.id)

    if (error) {
      console.error('Error updating task:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error updating task:', error)
    return false
  }
}

export const deleteTask = async (
  supabase: SupabaseClient,
  taskId: string
) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error deleting task:', error)
    return false
  }
}
