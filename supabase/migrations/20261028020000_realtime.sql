-- Shared galaxies, step 4: changes reach every open board through Supabase Realtime.
-- Postgres Changes respects RLS for inserts and updates; deletes only carry the id.
-- Positions are left out on purpose: they belong to each user.
alter publication supabase_realtime add table
  public.tasks,
  public.categories,
  public.workspaces,
  public.workspace_members;
