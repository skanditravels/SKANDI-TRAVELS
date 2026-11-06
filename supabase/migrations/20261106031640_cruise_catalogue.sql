create table public.travel_info_cruises (
  id uuid primary key default gen_random_uuid(),
  record_id text not null unique,
  provider text not null,
  provider_cruise_id text,
  provider_itinerary_id text,
  title text not null,
  slug text,
  cruise_line text not null,
  ship_name text,
  ship_code text,
  destination_codes text[] not null default '{}',
  destination_names text[] not null default '{}',
  departure_port_code text,
  departure_port_name text,
  arrival_port_code text,
  arrival_port_name text,
  nights integer check (nights > 0),
  summary text,
  description text,
  image_url text,
  gallery jsonb not null default '[]',
  highlights jsonb not null default '[]',
  inclusions jsonb not null default '[]',
  itinerary jsonb not null default '[]',
  booking_url text,
  product_url text,
  source_url text,
  region text not null,
  locale text,
  currency text,
  provider_payload jsonb not null default '{}',
  provider_updated_at timestamptz,
  last_synced_at timestamptz not null,
  updated_at timestamptz not null default now(),
  featured boolean not null default false,
  sort_order integer not null default 999,
  active boolean not null default true,
  published boolean not null default false,
  customer_visible boolean not null default false
);

create table public.travel_info_cruise_sailings (
  id uuid primary key default gen_random_uuid(),
  cruise_id uuid not null references public.travel_info_cruises(id),
  record_id text not null unique,
  provider text not null,
  provider_sailing_id text,
  provider_group_id text,
  service_date date not null,
  return_date date,
  departure_port_code text,
  departure_port_name text,
  arrival_port_code text,
  arrival_port_name text,
  status text not null default 'UNKNOWN',
  sold_out boolean not null default false,
  availability_known boolean not null default false,
  available integer check (available >= 0),
  currency text,
  public_price numeric check (public_price >= 0),
  original_price numeric check (original_price >= 0),
  discount_amount numeric check (discount_amount >= 0),
  price_basis text not null default 'UNSPECIFIED',
  organized_pricing jsonb not null default '{}',
  stateroom_classes jsonb not null default '[]',
  service_charges jsonb,
  port_charges jsonb,
  booking_url text,
  source_url text,
  region text not null,
  locale text,
  provider_payload jsonb not null default '{}',
  provider_updated_at timestamptz,
  last_synced_at timestamptz not null,
  updated_at timestamptz not null default now(),
  active boolean not null default true,
  published boolean not null default false,
  customer_visible boolean not null default false
);

create table public.travel_info_cruise_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  region text not null,
  status text not null check (status in ('STARTED', 'COMPLETED', 'FAILED')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  input jsonb not null default '{}',
  metadata jsonb not null default '{}',
  fetched_count integer check (fetched_count >= 0),
  cruise_upserts integer check (cruise_upserts >= 0),
  sailing_upserts integer check (sailing_upserts >= 0),
  error_code text,
  error_message text
);

create index travel_info_cruises_public_region_idx
  on public.travel_info_cruises (region, featured desc, sort_order, title)
  where active and published and customer_visible;
create index travel_info_cruise_sailings_cruise_id_idx
  on public.travel_info_cruise_sailings (cruise_id);
create index travel_info_cruise_sailings_public_region_idx
  on public.travel_info_cruise_sailings (region, service_date)
  where active and published and customer_visible;
create index travel_info_cruise_sync_runs_region_idx
  on public.travel_info_cruise_sync_runs (provider, region, started_at desc);

alter table public.travel_info_cruises enable row level security;
alter table public.travel_info_cruise_sailings enable row level security;
alter table public.travel_info_cruise_sync_runs enable row level security;

revoke all on table public.travel_info_cruises, public.travel_info_cruise_sailings,
  public.travel_info_cruise_sync_runs from public, anon, authenticated;
grant select, insert, update on table public.travel_info_cruises,
  public.travel_info_cruise_sailings, public.travel_info_cruise_sync_runs to service_role;
