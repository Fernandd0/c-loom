-- Workspaces are called galaxies in the app: a new account's first one is "My Galaxy".
-- Existing workspaces keep their names.
create or replace function private.handle_new_user()
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
  values (new.id, 'My Galaxy');

  return new;
end;
$$;
