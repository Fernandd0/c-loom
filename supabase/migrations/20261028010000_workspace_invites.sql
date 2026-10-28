-- Shared galaxies, step 3: the owner shares a galaxy with a link; whoever opens it signed
-- in joins as an editor. At most one link per galaxy; resetting it changes the token and
-- deleting it stops sharing. Joining goes through join_workspace, never a direct insert.

create table public.workspace_invites (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  -- Two random UUIDs without dashes: 244 random bits, unguessable.
  token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index workspace_invites_created_by_idx on public.workspace_invites (created_by);

alter table public.workspace_invites enable row level security;

create policy "workspace_invites: owner only" on public.workspace_invites
  for all to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

-- Joins the galaxy behind an invite token as an editor and returns its id.
-- Joining twice (or the owner opening their own link) changes nothing.
create function public.join_workspace(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  ws uuid;
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select i.workspace_id into ws
  from public.workspace_invites i
  where i.token = invite_token;

  if ws is null then
    raise exception 'Invite not found' using errcode = 'P0002';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws, me, 'editor')
  on conflict do nothing;

  return ws;
end;
$$;

revoke execute on function public.join_workspace (text) from public, anon;
grant execute on function public.join_workspace (text) to authenticated;

-- Name and avatar of a galaxy's members, for members only. Emails stay private.
create function public.workspace_member_profiles(ws_id uuid)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  role text,
  joined_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, p.full_name, p.avatar_url, m.role, m.joined_at
  from public.workspace_members m
  join public.profiles p on p.id = m.user_id
  where m.workspace_id = ws_id
    and private.is_workspace_member(ws_id)
  order by m.joined_at;
$$;

revoke execute on function public.workspace_member_profiles (uuid) from public, anon;
grant execute on function public.workspace_member_profiles (uuid) to authenticated;
