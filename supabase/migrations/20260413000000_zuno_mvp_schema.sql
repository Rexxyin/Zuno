-- Zuno MVP schema + RLS policies
-- Apply with: supabase db reset / supabase db push

create extension if not exists pgcrypto;

-- Enums
create type public.plan_category as enum (
  'hiking',
  'food',
  'music',
  'cycling',
  'art',
  'travel',
  'sports',
  'other'
);

create type public.plan_status as enum (
  'active',
  'full',
  'completed',
  'cancelled'
);

create type public.participant_status as enum (
  'pending',
  'joined',
  'left',
  'attended',
  'declined'
);

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  instagram_handle text,
  phone_verified boolean default false,
  reliability_score float default 100,
  total_joined int default 0,
  total_attended int default 0,
  created_at timestamptz default now()
);

-- Plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text,
  location_name text not null,
  datetime timestamptz not null,
  max_people int not null default 8,
  whatsapp_link text not null,
  image_url text,
  category public.plan_category default 'other',
  status public.plan_status default 'active',
  approval_mode boolean default false,
  female_only boolean default false,
  created_at timestamptz default now()
);

-- Participants
create table public.plan_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  status public.participant_status default 'joined',
  joined_at timestamptz default now(),
  unique (user_id, plan_id)
);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  added_by uuid not null references public.users (id) on delete cascade,
  label text not null,
  total_amount numeric not null check (total_amount >= 0),
  split_equally boolean default true,
  created_at timestamptz default now()
);

-- Post-event photos
create table public.plan_photos (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  uploaded_by uuid not null references public.users (id) on delete cascade,
  image_url text not null,
  uploaded_at timestamptz default now()
);

-- Helpful indexes
create index plans_datetime_idx on public.plans (datetime desc);
create index plans_status_idx on public.plans (status);
create index plans_category_idx on public.plans (category);
create index plan_participants_plan_id_status_idx on public.plan_participants (plan_id, status);
create index expenses_plan_id_idx on public.expenses (plan_id);
create index plan_photos_plan_id_idx on public.plan_photos (plan_id);

-- RLS
alter table public.users enable row level security;
alter table public.plans enable row level security;
alter table public.plan_participants enable row level security;
alter table public.expenses enable row level security;
alter table public.plan_photos enable row level security;

-- Users: public read, self write
create policy "Public read" on public.users
  for select using (true);

create policy "Self update" on public.users
  for update using (auth.uid() = id);

create policy "Self insert" on public.users
  for insert with check (auth.uid() = id);

-- Plans: public read, auth create, host edit
create policy "Public read" on public.plans
  for select using (true);

create policy "Auth create" on public.plans
  for insert with check (auth.uid() = host_id);

create policy "Host update" on public.plans
  for update using (auth.uid() = host_id);

-- Participants: join requires auth
create policy "Public read" on public.plan_participants
  for select using (true);

create policy "Auth join" on public.plan_participants
  for insert with check (auth.uid() = user_id);

create policy "Self update" on public.plan_participants
  for update using (auth.uid() = user_id);

create policy "Host can update" on public.plan_participants
  for update using (
    auth.uid() = (
      select host_id
      from public.plans
      where id = plan_id
    )
  );

-- Expenses: participants can read, anyone in plan can add
create policy "Participant read" on public.expenses
  for select using (true);

create policy "Auth add" on public.expenses
  for insert with check (auth.uid() = added_by);

-- Photos: public read, participant upload
create policy "Public read" on public.plan_photos
  for select using (true);

create policy "Auth upload" on public.plan_photos
  for insert with check (auth.uid() = uploaded_by);
