-- Fixes a bug in 0002: a worker could not read their own service_type /
-- service_type_version while it was still draft (before their first save
-- locks it), because service_types_select only allowed 'standardized' rows
-- or admins. This broke /dashboard with a 500 for any worker on a draft type.

create or replace function cb_is_worker_of_service_type(target_service_type_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workers
    where service_type_id = target_service_type_id and user_id = auth.uid()
  );
$$;

drop policy if exists service_types_select on service_types;
create policy service_types_select on service_types
  for select using (
    status = 'standardized'
    or cb_is_admin_for_service_type(id)
    or cb_is_worker_of_service_type(id)
  );

drop policy if exists service_type_versions_select on service_type_versions;
create policy service_type_versions_select on service_type_versions
  for select using (
    cb_is_admin_for_service_type(service_type_id)
    or cb_is_worker_of_service_type(service_type_id)
    or exists (
      select 1 from service_types st
      where st.id = service_type_id and st.status = 'standardized'
    )
  );
