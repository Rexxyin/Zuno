alter table public.users
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text;

-- Allow users to write own audit trail (critical action logging)
drop policy if exists "Audit service role read" on public.audit_logs;
drop policy if exists "Audit service role write" on public.audit_logs;

create policy if not exists "Audit self insert" on public.audit_logs
for insert with check (auth.uid() = actor_id);

create policy if not exists "Audit admin read" on public.audit_logs
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
  or auth.role() = 'service_role'
);

-- Allow admins to review reports + moderation actions
create policy if not exists "Reports admin read" on public.safety_reports
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
);

create policy if not exists "Reports admin update" on public.safety_reports
for update using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
);

drop policy if exists "Moderation service role read" on public.moderation_actions;
drop policy if exists "Moderation service role write" on public.moderation_actions;

create policy if not exists "Moderation admin read" on public.moderation_actions
for select using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
  or auth.role() = 'service_role'
);

create policy if not exists "Moderation admin write" on public.moderation_actions
for all using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
  or auth.role() = 'service_role'
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.is_admin = true
  )
  or auth.role() = 'service_role'
);

notify pgrst, 'reload schema';
