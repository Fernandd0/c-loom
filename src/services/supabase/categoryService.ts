import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { Category } from '@/app/types'
import { categoryToInsert, categoryToUpdate } from './mappers'

export const createCategory = async (
  supabase: SupabaseClient<Database>,
  category: Category
) => {
  const { error } = await supabase
    .from('categories')
    .insert(categoryToInsert(category))

  if (error) {
    console.error('Error creating category:', error)
    return false
  }
  return true
}

export const updateCategory = async (
  supabase: SupabaseClient<Database>,
  categoryId: string,
  updates: Partial<Category>
) => {
  const { error } = await supabase
    .from('categories')
    .update(categoryToUpdate(updates))
    .eq('id', categoryId)

  if (error) {
    console.error('Error updating category:', error)
    return false
  }
  return true
}

export const deleteCategory = async (
  supabase: SupabaseClient<Database>,
  categoryId: string
) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    console.error('Error deleting category:', error)
    return false
  }
  return true
}
