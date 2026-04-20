-- Safety + auth foundation tables for MVP moderation, consent, and trust signals

-- Optional phone verification metadata (phone remains secondary verification layer)
alter table public.users
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_verification_provider text;

-- One-time lightweight safety consent capture
create table if not exists public.user_safety_consents (
  user_id uuid primary key references public.users(id) on delete cascade,
  is_adult boolean not null default false,
  agreed_terms boolean not null default false,
  acknowledged_safety_responsibility boolean not null default false,
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_user_safety_consents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_safety_consents_updated_at on public.user_safety_consents;
create trigger trg_user_safety_consents_updated_at
before update on public.user_safety_consents
for each row execute function public.touch_user_safety_consents_updated_at();

-- Block graph: blocked users cannot interact/see each other (enforcement in app/api layer)
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id, created_at desc);

-- Reports for profiles/plans
create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'plan')),
  target_user_id uuid references public.users(id) on delete set null,
  target_plan_id uuid references public.plans(id) on delete set null,
  reason text not null check (reason in ('fake_profile', 'harassment', 'unsafe_plan', 'spam', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null,
  constraint safety_reports_target_check check (
    (target_type = 'profile' and target_user_id is not null and target_plan_id is null)
    or
    (target_type = 'plan' and target_plan_id is not null)
  )
);

create index if not exists safety_reports_status_created_idx on public.safety_reports (status, created_at desc);
create index if not exists safety_reports_target_user_idx on public.safety_reports (target_user_id);
create index if not exists safety_reports_target_plan_idx on public.safety_reports (target_plan_id);

-- Manual moderation actions (ignore/remove plan/ban user)
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.users(id) on delete set null,
  report_id uuid references public.safety_reports(id) on delete set null,
  action text not null check (action in ('ignore_report', 'remove_plan', 'ban_user', 'unban_user')),
  target_user_id uuid references public.users(id) on delete set null,
  target_plan_id uuid references public.plans(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists moderation_actions_created_idx on public.moderation_actions (created_at desc);

-- Critical action logging for audit trail
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_event_created_idx on public.audit_logs (event_type, created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);

-- Host-control metadata for participant removals
alter table public.plan_participants
  add column if not exists removed_by_host boolean not null default false,
  add column if not exists removed_by_host_at timestamptz,
  add column if not exists removed_by_host_user_id uuid references public.users(id) on delete set null;

-- RLS
alter table public.user_safety_consents enable row level security;
alter table public.user_blocks enable row level security;
alter table public.safety_reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;

-- Consent: user owns own row
create policy if not exists "Consent self read" on public.user_safety_consents
for select using (auth.uid() = user_id);

create policy if not exists "Consent self upsert" on public.user_safety_consents
for insert with check (auth.uid() = user_id);

create policy if not exists "Consent self update" on public.user_safety_consents
for update using (auth.uid() = user_id);

-- Blocks: user manages own block list
create policy if not exists "Blocks self read" on public.user_blocks
for select using (auth.uid() = blocker_id);

create policy if not exists "Blocks self insert" on public.user_blocks
for insert with check (auth.uid() = blocker_id);

create policy if not exists "Blocks self delete" on public.user_blocks
for delete using (auth.uid() = blocker_id);

-- Reports: user can file and view own reports
create policy if not exists "Reports own read" on public.safety_reports
for select using (auth.uid() = reporter_id);

create policy if not exists "Reports own insert" on public.safety_reports
for insert with check (auth.uid() = reporter_id);

-- Moderation + audit logs are service-role/admin managed
create policy if not exists "Moderation service role read" on public.moderation_actions
for select using (auth.role() = 'service_role');

create policy if not exists "Moderation service role write" on public.moderation_actions
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy if not exists "Audit service role read" on public.audit_logs
for select using (auth.role() = 'service_role');

create policy if not exists "Audit service role write" on public.audit_logs
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

notify pgrst, 'reload schema';
