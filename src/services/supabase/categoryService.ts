import { SupabaseClient } from '@supabase/supabase-js'
import { Category } from '@/app/types'

export const createCategory = async (
  supabase: SupabaseClient,
  category: Category
) => {
  try {
    const { error } = await supabase.from('categories').insert({
      id: category.id,
      workspace_id: category.workspaceId,
      name: category.name,
      color: category.color,
    })

    if (error) {
      console.error('Error creating category:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error creating category:', error)
    return false
  }
}

export const updateCategory = async (
  supabase: SupabaseClient,
  categoryId: string,
  updates: Partial<Category>
) => {
  try {
    const { error } = await supabase
      .from('categories')
      .update({
        name: updates.name,
        color: updates.color,
      })
      .eq('id', categoryId)

    if (error) {
      console.error('Error updating category:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error updating category:', error)
    return false
  }
}

export const deleteCategory = async (
  supabase: SupabaseClient,
  categoryId: string
) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)

    if (error) {
      console.error('Error deleting category:', error)
      return false
    }
    return true
  } catch (error) {
    console.error('Unexpected error deleting category:', error)
    return false
  }
}
