-- Ensure optional maps column exists everywhere
alter table public.plans
add column if not exists google_maps_link text;

-- Keep whatsapp optional-compatible for clients that may omit it
alter table public.plans
alter column whatsapp_link drop not null;

-- Auto-create profile row when auth user is created
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
    new.raw_user_meta_data ->> 'avatar_url',
    null
  )
  on conflict (id) do update
    set name = excluded.name,
        avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- Reload PostgREST schema cache (helps with "column not found in schema cache")
notify pgrst, 'reload schema';
