-- Keep API payload and database schema in sync for cost fields
-- and force PostgREST to refresh cached schema metadata.

alter table public.plans
  add column if not exists estimated_cost numeric;

notify pgrst, 'reload schema';
