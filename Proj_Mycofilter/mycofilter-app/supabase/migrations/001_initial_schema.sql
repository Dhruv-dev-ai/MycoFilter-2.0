-- MycoFilter 2.0 — Supabase Database Migration 001
-- Run in Supabase SQL editor or via supabase db push

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Devices ──────────────────────────────────────────────────────────────────
create table if not exists devices (
  id                    text primary key,
  name                  text not null,
  location_description  text,
  installed_at          timestamptz,
  commissioned_at       timestamptz,
  connectivity_method   text not null default 'simulated',
  reporting_interval_s  integer not null default 30,
  firmware_version      text,
  is_demo               boolean not null default false,
  created_at            timestamptz not null default now()
);

-- ── Telemetry events ─────────────────────────────────────────────────────────
create table if not exists telemetry_events (
  id                  uuid primary key default gen_random_uuid(),
  device_id           text not null references devices(id),
  sensor_id           text not null,
  measurement_point   text not null,
  raw_value           double precision,
  raw_unit            text,
  calibrated_value    double precision,
  unit                text,
  water_temperature_c double precision,
  observed_at         timestamptz not null,
  received_at         timestamptz not null default now(),
  sequence_number     bigint,
  calibration_version text,
  quality_flag        text not null default 'missing',
  source_mode         text not null default 'simulated',
  firmware_version    text
);

create index if not exists idx_telemetry_device_time on telemetry_events(device_id, observed_at desc);
create index if not exists idx_telemetry_sensor      on telemetry_events(device_id, sensor_id, observed_at desc);

-- ── Alerts ───────────────────────────────────────────────────────────────────
create table if not exists alerts (
  id                uuid primary key default gen_random_uuid(),
  device_id         text not null references devices(id),
  sensor_id         text,
  severity          text not null default 'info',
  title             text not null,
  message           text not null,
  parameter         text,
  observed_value    double precision,
  threshold         double precision,
  created_at        timestamptz not null default now(),
  acknowledged_at   timestamptz,
  acknowledged_by   uuid references auth.users(id)
);

-- ── Maintenance events ───────────────────────────────────────────────────────
create table if not exists maintenance_events (
  id                  uuid primary key default gen_random_uuid(),
  device_id           text not null references devices(id),
  cartridge_id        text,
  component           text not null,
  action              text not null,
  observation         text,
  replacement_materials text,
  performed_by        text not null,
  performed_at        timestamptz not null,
  next_inspection_at  timestamptz,
  notes               text,
  created_at          timestamptz not null default now()
);

-- ── Lab measurements ─────────────────────────────────────────────────────────
create table if not exists lab_measurements (
  id                uuid primary key default gen_random_uuid(),
  device_id         text not null references devices(id),
  sample_id         text not null,
  analyte           text not null,
  method            text not null,
  value             double precision not null,
  unit              text not null,
  uncertainty       double precision,
  detection_limit   double precision,
  sampled_at        timestamptz not null,
  analysed_at       timestamptz not null,
  lab               text,
  notes             text,
  source            text not null,
  is_MBAS_not_LAS   boolean default false,
  created_at        timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table devices            enable row level security;
alter table telemetry_events   enable row level security;
alter table alerts             enable row level security;
alter table maintenance_events enable row level security;
alter table lab_measurements   enable row level security;

-- Users table (maps auth.users to device access)
create table if not exists user_device_access (
  user_id   uuid not null references auth.users(id) on delete cascade,
  device_id text not null references devices(id),
  role      text not null default 'viewer',
  primary key (user_id, device_id)
);

-- RLS policies: users see only their assigned devices
create policy "Users see own devices" on devices
  for select using (
    id in (select device_id from user_device_access where user_id = auth.uid())
    or is_demo = true
  );

create policy "Users see own telemetry" on telemetry_events
  for select using (
    device_id in (select device_id from user_device_access where user_id = auth.uid())
    or device_id like '%-DEMO'
  );

-- Service role can insert telemetry (from ingestion endpoint)
create policy "Service role inserts telemetry" on telemetry_events
  for insert with check (true);
