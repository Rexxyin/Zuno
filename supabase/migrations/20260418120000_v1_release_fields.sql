alter table public.plans
  add column if not exists cost_mode text check (cost_mode in ('per_person','total')),
  add column if not exists cost_amount numeric,
  add column if not exists final_amount numeric,
  add column if not exists deleted_at timestamptz;

alter table public.users
  add column if not exists upi_payee_name text;

alter table public.plans
  drop constraint if exists plans_visibility_check;

alter table public.plans
  add constraint plans_visibility_check check (visibility in ('public','private','invite_only'));
