-- New workspaces no longer get an "Urgent" category: urgency comes from the deadline and
-- importance from the priority. Existing workspaces keep the categories they already have.
create or replace function private.seed_workspace_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (workspace_id, name, color)
  values
    (new.id, 'Work', '#3b82f6'),
    (new.id, 'Personal', '#10b981');
  return new;
end;
$$;
