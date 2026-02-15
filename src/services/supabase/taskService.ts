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
      recurrence: task.recurrence || 'never',
      priority: task.priority ?? 0,
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
  taskId: string,
  updates: Partial<Task>
) => {
  try {
    // Build the update object dynamically
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.pos_x !== undefined) updateData.pos_x = updates.pos_x
    if (updates.pos_y !== undefined) updateData.pos_y = updates.pos_y
    if (updates.completed !== undefined) {
      updateData.completed = updates.completed
      updateData.completed_at = updates.completed ? new Date().toISOString() : null
    }
    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline ? new Date(updates.deadline).toISOString() : null
    }
    if (updates.categoryId !== undefined) {
      updateData.category_id = updates.categoryId === 'default' ? null : updates.categoryId
    }
    if (updates.recurrence !== undefined) {
      updateData.recurrence = updates.recurrence
    }
    if (updates.priority !== undefined) {
      updateData.priority = updates.priority
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

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
