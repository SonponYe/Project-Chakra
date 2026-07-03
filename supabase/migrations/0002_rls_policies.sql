-- Capital Business: row level security
-- Enforces the three-tier role model (super_admin / service_manager / worker)
-- plus anonymous public browsing, at the database layer.

-- ---------------------------------------------------------------------------
-- helper functions (security definer so they can read `admins`/`workers`
-- without recursing into the RLS policies that call them)
-- ---------------------------------------------------------------------------
create or replace function is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function is_service_manager_for(target_service_type_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admins
    where user_id = auth.uid()
      and role = 'service_manager'
      and target_service_type_id = any (assigned_service_type_ids)
  );
$$;

create or replace function is_admin_for_service_type(target_service_type_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_super_admin() or is_service_manager_for(target_service_type_id);
$$;

create or replace function owns_worker(target_worker_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workers
    where id = target_worker_id and user_id = auth.uid()
  );
$$;

create or replace function worker_service_type_id(target_worker_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select service_type_id from workers where id = target_worker_id;
$$;

create or replace function is_admin_for_worker(target_worker_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select is_admin_for_service_type(worker_service_type_id(target_worker_id));
$$;

-- a worker/service type is visible to the public once the category is
-- standardized (locked) and the worker is active
create or replace function is_publicly_visible_worker(target_worker_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workers w
    join service_types st on st.id = w.service_type_id
    where w.id = target_worker_id
      and w.status = 'active'
      and st.status = 'standardized'
  );
$$;

-- ---------------------------------------------------------------------------
-- column-lock triggers (RLS can't restrict individual columns on its own)
-- ---------------------------------------------------------------------------

-- workers may edit their own display_name/bio/status but never reassign
-- themselves to a different service type
create or replace function prevent_worker_service_type_change()
returns trigger
language plpgsql
as $$
begin
  if not is_admin_for_service_type(new.service_type_id) and new.service_type_id <> old.service_type_id then
    raise exception 'workers cannot change their own service_type_id';
  end if;
  return new;
end;
$$;

create trigger workers_prevent_service_type_change
  before update on workers
  for each row execute function prevent_worker_service_type_change();

-- workers may only fill in worker_response on a review; rating/text/etc are
-- owned by the reviewer and immutable once submitted
create or replace function prevent_review_content_edit_by_worker()
returns trigger
language plpgsql
as $$
begin
  if not is_super_admin()
    and (new.rating <> old.rating or new.text is distinct from old.text
         or new.reviewer_user_id is distinct from old.reviewer_user_id
         or new.booking_id is distinct from old.booking_id
         or new.worker_id <> old.worker_id) then
    raise exception 'only worker_response may be edited after a review is submitted';
  end if;
  return new;
end;
$$;

create trigger reviews_prevent_content_edit
  before update on reviews
  for each row execute function prevent_review_content_edit_by_worker();

-- ---------------------------------------------------------------------------
-- enable RLS
-- ---------------------------------------------------------------------------
alter table admins enable row level security;
alter table service_types enable row level security;
alter table service_type_versions enable row level security;
alter table workers enable row level security;
alter table worker_module_data enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
create policy admins_select on admins
  for select using (is_super_admin() or user_id = auth.uid());

create policy admins_insert on admins
  for insert with check (is_super_admin());

create policy admins_update on admins
  for update using (is_super_admin());

create policy admins_delete on admins
  for delete using (is_super_admin());

-- ---------------------------------------------------------------------------
-- service_types
-- ---------------------------------------------------------------------------
create policy service_types_select on service_types
  for select using (
    status = 'standardized' or is_admin_for_service_type(id)
  );

create policy service_types_insert on service_types
  for insert with check (is_super_admin());

create policy service_types_update on service_types
  for update using (is_super_admin());

create policy service_types_delete on service_types
  for delete using (is_super_admin());

-- ---------------------------------------------------------------------------
-- service_type_versions
-- ---------------------------------------------------------------------------
create policy service_type_versions_select on service_type_versions
  for select using (
    is_admin_for_service_type(service_type_id)
    or exists (
      select 1 from service_types st
      where st.id = service_type_id and st.status = 'standardized'
    )
  );

create policy service_type_versions_insert on service_type_versions
  for insert with check (is_super_admin());

create policy service_type_versions_update on service_type_versions
  for update using (is_super_admin());

create policy service_type_versions_delete on service_type_versions
  for delete using (is_super_admin());

-- ---------------------------------------------------------------------------
-- workers
-- ---------------------------------------------------------------------------
create policy workers_select on workers
  for select using (
    user_id = auth.uid()
    or is_admin_for_service_type(service_type_id)
    or (status = 'active' and exists (
      select 1 from service_types st
      where st.id = service_type_id and st.status = 'standardized'
    ))
  );

create policy workers_insert on workers
  for insert with check (is_admin_for_service_type(service_type_id));

create policy workers_update on workers
  for update using (
    user_id = auth.uid() or is_admin_for_service_type(service_type_id)
  );

create policy workers_delete on workers
  for delete using (is_admin_for_service_type(service_type_id));

-- ---------------------------------------------------------------------------
-- worker_module_data
-- ---------------------------------------------------------------------------
create policy worker_module_data_select on worker_module_data
  for select using (
    owns_worker(worker_id)
    or is_admin_for_worker(worker_id)
    or is_publicly_visible_worker(worker_id)
  );

create policy worker_module_data_insert on worker_module_data
  for insert with check (owns_worker(worker_id) or is_admin_for_worker(worker_id));

create policy worker_module_data_update on worker_module_data
  for update using (owns_worker(worker_id) or is_admin_for_worker(worker_id));

create policy worker_module_data_delete on worker_module_data
  for delete using (is_admin_for_worker(worker_id));

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create policy bookings_select on bookings
  for select using (
    requester_user_id = auth.uid()
    or owns_worker(worker_id)
    or is_admin_for_worker(worker_id)
  );

create policy bookings_insert on bookings
  for insert with check (
    auth.uid() is not null and requester_user_id = auth.uid()
  );

create policy bookings_update on bookings
  for update using (
    owns_worker(worker_id) or is_admin_for_worker(worker_id)
  );

create policy bookings_delete on bookings
  for delete using (
    (requester_user_id = auth.uid() and status = 'pending')
    or is_admin_for_worker(worker_id)
  );

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create policy reviews_select on reviews
  for select using (
    is_publicly_visible_worker(worker_id)
    or owns_worker(worker_id)
    or is_admin_for_worker(worker_id)
    or reviewer_user_id = auth.uid()
  );

create policy reviews_insert on reviews
  for insert with check (
    auth.uid() is not null and reviewer_user_id = auth.uid()
  );

create policy reviews_update on reviews
  for update using (
    owns_worker(worker_id) or is_super_admin()
  );

create policy reviews_delete on reviews
  for delete using (is_super_admin());
