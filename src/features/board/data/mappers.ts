import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/lib/supabase/database.types'
import { Board, Category, Task, TaskRecurrence } from '@/app/types'
import { parseDeadline } from '@/lib/dates'

// The only place that converts between snake_case rows and camelCase domain objects.
// Adding a column means updating every function here.

const toIso = (value: string | undefined) =>
  parseDeadline(value)?.toISOString() ?? null

export const taskFromRow = (row: Tables<'tasks'>): Task => ({
  id: row.id,
  title: row.title,
  description: row.description,
  createdAt: row.created_at,
  pos_x: row.pos_x,
  pos_y: row.pos_y,
  categoryId: row.category_id ?? '',
  workspaceId: row.workspace_id,
  deadline: row.deadline ?? undefined,
  recurrence: row.recurrence as TaskRecurrence,
  priority: row.priority,
})

export const taskToInsert = (task: Task): TablesInsert<'tasks'> => ({
  id: task.id,
  workspace_id: task.workspaceId,
  category_id: task.categoryId || null,
  title: task.title,
  description: task.description ?? '',
  pos_x: task.pos_x,
  pos_y: task.pos_y,
  priority: task.priority ?? 0,
  recurrence: task.recurrence,
  deadline: toIso(task.deadline),
  created_at: task.createdAt,
})

export const taskToUpdate = (updates: Partial<Task>): TablesUpdate<'tasks'> => {
  const row: TablesUpdate<'tasks'> = {}
  if (updates.title !== undefined) row.title = updates.title
  if (updates.description !== undefined) row.description = updates.description
  if (updates.pos_x !== undefined) row.pos_x = updates.pos_x
  if (updates.pos_y !== undefined) row.pos_y = updates.pos_y
  if (updates.categoryId !== undefined)
    row.category_id = updates.categoryId || null
  if (updates.priority !== undefined) row.priority = updates.priority
  if (updates.recurrence !== undefined) row.recurrence = updates.recurrence
  if ('deadline' in updates) row.deadline = toIso(updates.deadline)
  if (updates.createdAt !== undefined) row.created_at = updates.createdAt
  return row
}

export const categoryFromRow = (row: Tables<'categories'>): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  icon: row.icon ?? undefined,
  workspaceId: row.workspace_id,
})

export const categoryToInsert = (
  category: Category
): TablesInsert<'categories'> => ({
  id: category.id,
  workspace_id: category.workspaceId,
  name: category.name,
  color: category.color,
  icon: category.icon ?? null,
})

export const categoryToUpdate = (
  updates: Partial<Category>
): TablesUpdate<'categories'> => {
  const row: TablesUpdate<'categories'> = {}
  if (updates.name !== undefined) row.name = updates.name
  if (updates.color !== undefined) row.color = updates.color
  if ('icon' in updates) row.icon = updates.icon ?? null
  return row
}

export const boardFromRow = (
  row: Tables<'workspaces'>,
  tasks: Task[] = []
): Board => ({
  id: row.id,
  name: row.name,
  userId: row.user_id,
  createdAt: row.created_at,
  tasks,
})
