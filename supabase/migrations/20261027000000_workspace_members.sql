-- Shared galaxies, step 1: access goes through membership instead of a single owner.
-- workspaces.user_id stays the owner; workspace_members lists everyone with access,
-- the owner included. Nothing changes for existing users: each owns their workspaces.

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);
-- One owner per workspace.
create unique index workspace_members_one_owner_idx
  on public.workspace_members (workspace_id)
  where role = 'owner';

-- The creator of a workspace becomes its owner member.
create function private.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.user_id, 'owner');
  return new;
end;
$$;

create trigger workspaces_add_owner
  after insert on public.workspaces
  for each row execute function private.add_workspace_owner();

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.user_id, 'owner'
from public.workspaces w
on conflict do nothing;

-- Security definer so policies can call it without recursing into workspace_members' own RLS.
create function private.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws_id and m.user_id = (select auth.uid())
  );
$$;

grant execute on function private.is_workspace_member (uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.workspace_members enable row level security;

-- Members see who else is in their workspaces. Rows are added only by the owner trigger
-- (and later the join function), so there is no insert or update policy.
create policy "workspace_members: members read" on public.workspace_members
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

-- An editor can leave; the owner can remove editors. The owner row only goes with the workspace.
create policy "workspace_members: leave or remove editors" on public.workspace_members
  for delete to authenticated
  using (
    role = 'editor'
    and (
      user_id = (select auth.uid())
      or private.is_workspace_owner(workspace_id)
    )
  );

drop policy "workspaces: owner full access" on public.workspaces;

create policy "workspaces: members read" on public.workspaces
  for select to authenticated
  using (private.is_workspace_member(id));

create policy "workspaces: create own" on public.workspaces
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "workspaces: members rename" on public.workspaces
  for update to authenticated
  using (private.is_workspace_member(id))
  with check (private.is_workspace_member(id));

create policy "workspaces: owner deletes" on public.workspaces
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Members may rename, but never change the owner: only the name column is updatable.
revoke update on public.workspaces from anon, authenticated;
grant update (name) on public.workspaces to authenticated;

drop policy "categories: workspace owner full access" on public.categories;

create policy "categories: members full access" on public.categories
  for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));

drop policy "tasks: workspace owner full access" on public.tasks;

create policy "tasks: members full access" on public.tasks
  for all to authenticated
  using (private.is_workspace_member(workspace_id))
  with check (private.is_workspace_member(workspace_id));
