-- Keep avatar_url empty by default so Dicebear remains primary unless user sets custom image.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, avatar_url, instagram_handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Zuno User'),
    null,
    null
  )
  on conflict (id) do update
    set name = excluded.name;

  return new;
end;
$$;

notify pgrst, 'reload schema';
