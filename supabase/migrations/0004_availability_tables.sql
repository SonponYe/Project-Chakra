-- Capital Business: worker availability
-- Recurring weekly blocks + one-off blocked dates back the booking/availability
-- module. Kept as real relational tables (not JSONB) because visitor-facing
-- slot computation needs to query/join them directly.

create table worker_availability (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  constraint worker_availability_time_order check (start_time < end_time)
);

create index worker_availability_worker_id_idx on worker_availability (worker_id);

create table worker_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers (id) on delete cascade,
  blocked_date date not null,
  created_at timestamptz not null default now(),
  unique (worker_id, blocked_date)
);

create index worker_blocked_dates_worker_id_idx on worker_blocked_dates (worker_id);

alter table worker_availability enable row level security;
alter table worker_blocked_dates enable row level security;

-- visible to the owning worker, admins in scope, and the public (needed to
-- compute open slots on a standardized/active worker's public profile)
create policy worker_availability_select on worker_availability
  for select using (
    cb_owns_worker(worker_id)
    or cb_is_admin_for_worker(worker_id)
    or cb_is_publicly_visible_worker(worker_id)
  );

create policy worker_availability_insert on worker_availability
  for insert with check (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));

create policy worker_availability_update on worker_availability
  for update using (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));

create policy worker_availability_delete on worker_availability
  for delete using (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));

create policy worker_blocked_dates_select on worker_blocked_dates
  for select using (
    cb_owns_worker(worker_id)
    or cb_is_admin_for_worker(worker_id)
    or cb_is_publicly_visible_worker(worker_id)
  );

create policy worker_blocked_dates_insert on worker_blocked_dates
  for insert with check (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));

create policy worker_blocked_dates_update on worker_blocked_dates
  for update using (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));

create policy worker_blocked_dates_delete on worker_blocked_dates
  for delete using (cb_owns_worker(worker_id) or cb_is_admin_for_worker(worker_id));
