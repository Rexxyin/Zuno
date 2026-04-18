-- Align plan_status enum values with API usage.
-- The app writes statuses like 'open' and 'closed' when publishing/updating plans.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'plan_status'
      and t.typnamespace = 'public'::regnamespace
      and e.enumlabel = 'open'
  ) then
    alter type public.plan_status add value 'open';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'plan_status'
      and t.typnamespace = 'public'::regnamespace
      and e.enumlabel = 'closed'
  ) then
    alter type public.plan_status add value 'closed';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'plan_status'
      and t.typnamespace = 'public'::regnamespace
      and e.enumlabel = 'expired'
  ) then
    alter type public.plan_status add value 'expired';
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    where t.typname = 'plan_status'
      and t.typnamespace = 'public'::regnamespace
      and e.enumlabel = 'deleted'
  ) then
    alter type public.plan_status add value 'deleted';
  end if;
end $$;

alter table public.plans
  alter column status set default 'open';

update public.plans
set status = 'open'
where status = 'active';

notify pgrst, 'reload schema';
