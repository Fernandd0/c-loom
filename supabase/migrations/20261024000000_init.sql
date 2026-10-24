-- Initial schema: profiles, workspaces, categories, tasks, with RLS and signup provisioning.

-- Helpers live outside the API-exposed schema.
create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

create index workspaces_user_id_idx on public.workspaces (user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 50),
  color text not null check (color ~ '^#[0-9a-fA-F]{6}$'),
  icon text,
  created_at timestamptz not null default now(),
  -- Lets tasks reference (category, workspace) so a task can't use another workspace's category.
  unique (id, workspace_id)
);

create index categories_workspace_id_idx on public.categories (workspace_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  category_id uuid,
  title text not null check (char_length(title) between 1 and 500),
  description text not null default '',
  pos_x real not null default 50,
  pos_y real not null default 50,
  priority smallint not null default 0 check (priority between 0 and 10),
  recurrence text not null default 'never'
    check (recurrence in ('never', 'daily', 'weekly', 'monthly', 'yearly')),
  deadline timestamptz,
  created_at timestamptz not null default now(),
  foreign key (category_id, workspace_id)
    references public.categories (id, workspace_id)
    on delete set null (category_id)
);

create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_category_id_idx on public.tasks (category_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Every new workspace starts with the default categories.
create function private.seed_workspace_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (workspace_id, name, color)
  values
    (new.id, 'Work', '#3b82f6'),
    (new.id, 'Personal', '#10b981'),
    (new.id, 'Urgent', '#ef4444');
  return new;
end;
$$;

create trigger workspaces_seed_categories
  after insert on public.workspaces
  for each row execute function private.seed_workspace_categories();

-- Signup provisioning: profile + first workspace. Replaces the old /api/sync-user route.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.workspaces (user_id, name)
  values (new.id, 'My Workspace');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

create function private.is_workspace_owner(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = ws_id and w.user_id = (select auth.uid())
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_workspace_owner (uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;

-- Profiles are created by the signup trigger, so there is no insert policy.
create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "workspaces: owner full access" on public.workspaces
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "categories: workspace owner full access" on public.categories
  for all to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

create policy "tasks: workspace owner full access" on public.tasks
  for all to authenticated
  using (private.is_workspace_owner(workspace_id))
  with check (private.is_workspace_owner(workspace_id));

-- ---------------------------------------------------------------------------
-- Backfill users that signed up before this migration
-- ---------------------------------------------------------------------------

insert into public.profiles (id, email, full_name, avatar_url)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

insert into public.workspaces (user_id, name)
select p.id, 'My Workspace'
from public.profiles p
where not exists (select 1 from public.workspaces w where w.user_id = p.id);
