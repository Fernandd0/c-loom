import { User } from '@supabase/supabase-js'

export async function syncUserProfile(user: User) {
  const timestamp = new Date().toISOString()
  console.log(`[ProfileService ${timestamp}] Calling /api/sync-user for user:`, user.id)
  
  try {
    const response = await fetch('/api/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    })
    
    const data = await response.json()
    console.log(`[ProfileService ${timestamp}] API Response:`, data)
    
    return data
  } catch (error) {
    console.error(`[ProfileService ${timestamp}] Error calling sync API:`, error)
    throw error
  }
}
