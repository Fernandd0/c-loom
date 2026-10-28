-- Shared galaxies, step 5: completing a task still takes it off the board, but leaves a
-- line in the galaxy's history saying who completed it and when. Rows are written only by
-- complete_task, so the history can't be forged or edited from the client.

create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- No foreign key: the task is usually gone.
  task_id uuid not null,
  title text not null,
  category_id uuid references public.categories (id) on delete set null,
  deadline timestamptz,
  completed_by uuid references public.profiles (id) on delete set null,
  -- Kept as written then, so the history reads the same after a member leaves.
  completed_by_name text,
  completed_at timestamptz not null default now()
);

create index task_completions_workspace_idx
  on public.task_completions (workspace_id, completed_at desc);
create index task_completions_category_id_idx on public.task_completions (category_id);
create index task_completions_completed_by_idx on public.task_completions (completed_by);

alter table public.task_completions enable row level security;

create policy "task_completions: members read" on public.task_completions
  for select to authenticated
  using (private.is_workspace_member(workspace_id));

-- Records the completion and, in the same transaction, deletes the task or moves a
-- repeating one to its next date (computed by the client, like before). A task that is
-- already gone, or not in one of your galaxies, is left alone: a double click is fine.
create function public.complete_task(
  p_task_id uuid,
  p_next_deadline timestamptz default null,
  p_next_anchor timestamptz default null,
  p_next_created_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  t public.tasks;
begin
  select * into t from public.tasks where id = p_task_id for update;
  if t.id is null or not private.is_workspace_member(t.workspace_id) then
    return;
  end if;

  insert into public.task_completions (
    workspace_id, task_id, title, category_id, deadline, completed_by, completed_by_name
  )
  values (
    t.workspace_id, t.id, t.title, t.category_id, t.deadline, me,
    (select p.full_name from public.profiles p where p.id = me)
  );

  if p_next_deadline is null then
    delete from public.tasks where id = t.id;
  else
    update public.tasks
    set deadline = p_next_deadline,
        recurrence_anchor = p_next_anchor,
        created_at = coalesce(p_next_created_at, now())
    where id = t.id;
  end if;
end;
$$;

revoke execute on function public.complete_task (uuid, timestamptz, timestamptz, timestamptz) from public, anon;
grant execute on function public.complete_task (uuid, timestamptz, timestamptz, timestamptz) to authenticated;

alter publication supabase_realtime add table public.task_completions;
