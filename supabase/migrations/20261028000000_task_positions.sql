-- Shared galaxies, step 2: every member places the circles on their own screen.
-- tasks.pos_x/pos_y stay as the starting position (the creator's); a row here overrides
-- it for one user. Different screens resolving collisions never fight over one layout.

create table public.task_positions (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  pos_x real not null,
  pos_y real not null,
  updated_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index task_positions_user_id_idx on public.task_positions (user_id);

create trigger task_positions_set_updated_at
  before update on public.task_positions
  for each row execute function private.set_updated_at();

create function private.can_access_task(t_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tasks t
    join public.workspace_members m on m.workspace_id = t.workspace_id
    where t.id = t_id and m.user_id = (select auth.uid())
  );
$$;

grant execute on function private.can_access_task (uuid) to authenticated;

alter table public.task_positions enable row level security;

create policy "task_positions: own, in your galaxies" on public.task_positions
  for all to authenticated
  using (user_id = (select auth.uid()) and private.can_access_task(task_id))
  with check (user_id = (select auth.uid()) and private.can_access_task(task_id));
