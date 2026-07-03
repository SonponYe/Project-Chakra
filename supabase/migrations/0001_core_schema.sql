-- Capital Business: core schema
-- Module system: service_types + service_type_versions define which modules a
-- category uses (JSONB module_config). worker_module_data stores each worker's
-- actual content per module, pinned to the version it was filled against.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------
create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'service_manager')),
  assigned_service_type_ids uuid[],
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- service_types (draft -> standardized) and their versioned module config
-- ---------------------------------------------------------------------------
create table service_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  archetype text not null check (
    archetype in (
      'creative_portfolio',
      'appointment_personal_care',
      'food_craft_goods',
      'retail_product',
      'financial_advisory',
      'trade_production_service'
    )
  ),
  status text not null default 'draft' check (status in ('draft', 'standardized')),
  current_version_id uuid,
  created_at timestamptz not null default now()
);

create table service_type_versions (
  id uuid primary key default gen_random_uuid(),
  service_type_id uuid not null references service_types (id) on delete cascade,
  version_number int not null,
  -- ordered list of module keys + per-module settings, e.g.
  -- [{"module_key": "gallery", "settings": {}}, {"module_key": "offering_list", "settings": {...}}]
  module_config jsonb not null,
  created_at timestamptz not null default now(),
  unique (service_type_id, version_number)
);

alter table service_types
  add constraint service_types_current_version_fk
  foreign key (current_version_id) references service_type_versions (id) on delete set null;

-- ---------------------------------------------------------------------------
-- workers
-- ---------------------------------------------------------------------------
create table workers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  service_type_id uuid not null references service_types (id) on delete restrict,
  display_name text not null,
  bio text,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create index workers_service_type_id_idx on workers (service_type_id);

-- ---------------------------------------------------------------------------
-- worker_module_data: one row per (worker, module) the service type defines
-- ---------------------------------------------------------------------------
create table worker_module_data (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers (id) on delete cascade,
  module_key text not null,
  data jsonb not null default '{}'::jsonb,
  version_id uuid not null references service_type_versions (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (worker_id, module_key)
);

create index worker_module_data_worker_id_idx on worker_module_data (worker_id);

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers (id) on delete cascade,
  requester_user_id uuid references auth.users (id) on delete set null,
  requester_name text not null,
  requester_contact text not null,
  note text,
  requested_slot timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed')),
  created_at timestamptz not null default now()
);

create index bookings_worker_id_idx on bookings (worker_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table reviews (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references workers (id) on delete cascade,
  booking_id uuid references bookings (id) on delete set null,
  reviewer_user_id uuid references auth.users (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  text text,
  worker_response text,
  created_at timestamptz not null default now()
);

create index reviews_worker_id_idx on reviews (worker_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for worker_module_data
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger worker_module_data_set_updated_at
  before update on worker_module_data
  for each row execute function set_updated_at();
