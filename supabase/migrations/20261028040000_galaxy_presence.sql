-- Shared galaxies, step 6: who has a galaxy open right now. Presence runs on a private
-- Realtime channel named "galaxy:<workspace id>", and only members may join it.

create function private.is_galaxy_topic_member(topic text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when topic ~ '^galaxy:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then private.is_workspace_member(substring(topic from 8)::uuid)
    else false
  end;
$$;

grant execute on function private.is_galaxy_topic_member (text) to authenticated;

create policy "galaxy presence: members listen" on realtime.messages
  for select to authenticated
  using (
    realtime.messages.extension = 'presence'
    and private.is_galaxy_topic_member((select realtime.topic()))
  );

create policy "galaxy presence: members announce" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and private.is_galaxy_topic_member((select realtime.topic()))
  );
