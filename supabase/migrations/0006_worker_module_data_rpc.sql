-- Capital Business: worker module data save + lock-on-first-save
-- Implements "the moment the first worker's module data is saved, the
-- service type transitions to standardized (locked)".

create or replace function cb_save_worker_module_data(
  p_worker_id uuid,
  p_module_key text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_type_id uuid;
  v_version_id uuid;
  v_status text;
begin
  if not (cb_owns_worker(p_worker_id) or cb_is_admin_for_worker(p_worker_id)) then
    raise exception 'not authorized for this worker';
  end if;

  select w.service_type_id, st.current_version_id, st.status
  into v_service_type_id, v_version_id, v_status
  from workers w
  join service_types st on st.id = w.service_type_id
  where w.id = p_worker_id;

  if v_service_type_id is null then
    raise exception 'worker not found';
  end if;

  insert into worker_module_data (worker_id, module_key, data, version_id)
  values (p_worker_id, p_module_key, p_data, v_version_id)
  on conflict (worker_id, module_key)
  do update set data = excluded.data, version_id = excluded.version_id, updated_at = now();

  if v_status = 'draft' then
    update service_types set status = 'standardized' where id = v_service_type_id;
  end if;
end;
$$;
