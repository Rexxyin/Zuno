-- Restore plan_status enum to canonical values used in production schema.
-- Supabase enums cannot remove values in-place, so recreate the type safely.

alter table public.plans
  alter column status drop default;

-- Normalize any transitional values before casting to the canonical enum.
update public.plans set status = 'active' where status::text in ('open');
update public.plans set status = 'cancelled' where status::text in ('closed', 'deleted');
update public.plans set status = 'completed' where status::text in ('expired');

do $$
begin
  if exists (
    select 1
    from pg_type
    where typname = 'plan_status'
      and typnamespace = 'public'::regnamespace
  ) then
    alter type public.plan_status rename to plan_status_old;

    create type public.plan_status as enum (
      'active',
      'full',
      'completed',
      'cancelled'
    );

    alter table public.plans
      alter column status type public.plan_status
      using status::text::public.plan_status;

    drop type public.plan_status_old;
  end if;
end $$;

alter table public.plans
  alter column status set default 'active';

notify pgrst, 'reload schema';
