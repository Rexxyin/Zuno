alter table public.users
  add column if not exists gender text,
  add column if not exists age int,
  add column if not exists phone_number text;

alter table public.plans
  add column if not exists visibility text not null default 'public' check (visibility in ('public', 'private')),
  add column if not exists host_mode text not null default 'host_managed' check (host_mode in ('host_managed', 'open')),
  add column if not exists total_amount numeric,
  add column if not exists per_person_amount numeric;

create table if not exists public.expense_settlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  settled boolean not null default false,
  settled_at timestamptz,
  unique(plan_id, user_id)
);

alter table public.expense_settlements enable row level security;

create policy if not exists "Participant read settlements" on public.expense_settlements
  for select using (true);

create policy if not exists "Self manage settlement" on public.expense_settlements
  for insert with check (auth.uid() = user_id);

create policy if not exists "Self update settlement" on public.expense_settlements
  for update using (auth.uid() = user_id);
