-- The owner can always read their workspace, not only through workspace_members.
-- An insert that returns the new row (an upsert, e.g. the guest import) checks the read
-- policy before the trigger has added the owner as a member, so it was rejected.
drop policy "workspaces: members read" on public.workspaces;

create policy "workspaces: owner and members read" on public.workspaces
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_workspace_member(id)
  );
