alter table plans
  add column if not exists host_included_in_spots_and_splits boolean not null default true;
