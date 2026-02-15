import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ... imports

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // 1. Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use Service Role Key if available (Bypass RLS for provisioning)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.warn('[Sync] SUPABASE_SERVICE_ROLE_KEY is missing. Using RLS logic.')
  }

  const adminClient = serviceRoleKey
    ? createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null

  const db = adminClient || supabase
  
  try {
    // ---------------------------------------------------------
    // FLOW: New User vs Existing User
    // ---------------------------------------------------------
    
    // 1. Sync Profile (Ensure profile exists)
    // We use UPSERT to handle both creation (New) and updates (Existing).
    // This satisfies "Create profile if new, reuse if existing".
    const { data: profile, error: profileError } = await db
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            avatar_url: user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (profileError || !profile) {
        console.error('[Sync] Profile Error:', profileError)
        // If we can't ensure profile, we can't continue safely.
        // If adminClient is missing, this might be RLS blocking INSERT.
        if (!adminClient) {
             return NextResponse.json({ 
                 error: 'Failed to sync profile. Check RLS policies.', 
                 details: profileError 
             }, { status: 500 })
        }
    }

    // 2. Check for Existing Workspaces
    console.log(`[Sync ${user.id}] Checking existing workspaces...`)
    
    const { count, error: countError } = await db
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log(`[Sync ${user.id}] Workspace count result:`, { count, error: countError })

    if (countError) {
      console.error(`[Sync ${user.id}] ❌ Workspace check error:`, countError)
      return NextResponse.json({ error: 'Failed to check workspaces' }, { status: 500 })
    }


    // 3. Provision Default Workspace (ONLY if New / No Workspaces)
    console.log(`[Sync ${user.id}] Workspace count: ${count}`)
    
    if (count === 0) {
      
      // Double-check right before insert (race condition protection)
      const { data: existingWorkspaces, error: recheckError } = await db
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
      
      if (recheckError) {
        console.error(`[Sync ${user.id}] ❌ Recheck error:`, recheckError)
        return NextResponse.json({ error: 'Failed to recheck workspaces' }, { status: 500 })
      }
      
      if (existingWorkspaces && existingWorkspaces.length > 0) {
        return NextResponse.json({ message: 'User synced successfully (race avoided)' })
      }
      
      const { data: newWorkspace, error: createError } = await db
        .from('workspaces')
        .insert({
          user_id: user.id,
          name: 'My Workspace'
        })
        .select()
        .single()
      
      if (createError) {
        console.error(`[Sync ${user.id}] ❌ Workspace creation error:`, createError)
        return NextResponse.json({ error: 'Failed to create default workspace' }, { status: 500 })
      }
      
      return NextResponse.json({ message: 'User provisioned successfully', workspace: newWorkspace })
    }

    // 4. Existing User (Has workspaces) -> Do nothing, just return success
    return NextResponse.json({ message: 'User synced successfully' })

  } catch (error) {
    console.error('[Sync] Unexpected Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
