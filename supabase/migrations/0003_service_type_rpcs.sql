-- Capital Business: service type creation / draft-editing RPCs
-- Wraps the multi-table writes (service_types + service_type_versions +
-- back-reference) in a single transaction, and re-checks the super_admin
-- role inside the function body rather than trusting the caller.

create or replace function cb_create_service_type_draft(
  p_name text,
  p_slug text,
  p_archetype text,
  p_module_config jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_type_id uuid;
  v_version_id uuid;
begin
  if not cb_is_super_admin() then
    raise exception 'only super admins can create service types';
  end if;

  insert into service_types (name, slug, archetype, status)
  values (p_name, p_slug, p_archetype, 'draft')
  returning id into v_service_type_id;

  insert into service_type_versions (service_type_id, version_number, module_config)
  values (v_service_type_id, 1, p_module_config)
  returning id into v_version_id;

  update service_types set current_version_id = v_version_id where id = v_service_type_id;

  return v_service_type_id;
end;
$$;

-- Draft service types are freely editable in place (no versioning yet --
-- versioning only matters once a type is standardized/locked).
create or replace function cb_update_service_type_draft_modules(
  p_service_type_id uuid,
  p_module_config jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_version_id uuid;
begin
  if not cb_is_super_admin() then
    raise exception 'only super admins can edit a service type''s module config';
  end if;

  select status, current_version_id into v_status, v_version_id
  from service_types
  where id = p_service_type_id;

  if v_status is null then
    raise exception 'service type not found';
  end if;

  if v_status <> 'draft' then
    raise exception 'only draft service types can be edited directly; standardized types require a new version';
  end if;

  update service_type_versions
  set module_config = p_module_config
  where id = v_version_id;
end;
$$;
