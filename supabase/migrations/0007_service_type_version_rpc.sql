-- Capital Business: propose a new version for an already-standardized service
-- type. Existing workers keep whatever version_id their saved module data
-- already references (never silently broken); only new saves and new
-- workers pick up the new current_version_id.

create or replace function cb_create_service_type_version(
  p_service_type_id uuid,
  p_module_config jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_next_version_number int;
  v_version_id uuid;
begin
  if not cb_is_super_admin() then
    raise exception 'only super admins can propose a new service type version';
  end if;

  select status into v_status from service_types where id = p_service_type_id;

  if v_status is null then
    raise exception 'service type not found';
  end if;

  if v_status <> 'standardized' then
    raise exception 'only standardized service types use versioned updates; draft types can be edited directly';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_next_version_number
  from service_type_versions
  where service_type_id = p_service_type_id;

  insert into service_type_versions (service_type_id, version_number, module_config)
  values (p_service_type_id, v_next_version_number, p_module_config)
  returning id into v_version_id;

  update service_types set current_version_id = v_version_id where id = p_service_type_id;

  return v_version_id;
end;
$$;
