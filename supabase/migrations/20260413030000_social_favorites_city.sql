-- User social/payment links
alter table public.users
add column if not exists instagram_url text,
add column if not exists gpay_link text;

-- Plan discoverability/payment visibility
alter table public.plans
add column if not exists city text default 'General',
add column if not exists show_payment_options boolean default false;

-- Favorites/Saved plans
create table if not exists public.plan_favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, plan_id)
);

create index if not exists plan_favorites_user_idx on public.plan_favorites (user_id, created_at desc);

alter table public.plan_favorites enable row level security;

create policy "Favorites own read" on public.plan_favorites
for select using (auth.uid() = user_id);

create policy "Favorites own insert" on public.plan_favorites
for insert with check (auth.uid() = user_id);

create policy "Favorites own delete" on public.plan_favorites
for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
