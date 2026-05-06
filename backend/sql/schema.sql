-- ─────────────────────────────────────────────────────────────────────────────
-- IOTA KYC — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Drop existing tables if re-running ───────────────────────────────────────
drop table if exists audit_logs  cascade;
drop table if exists kyc_data    cascade;
drop table if exists kyc_sessions cascade;

-- ── kyc_sessions ─────────────────────────────────────────────────────────────
create table kyc_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text,                          -- iqama-based ID for now
  iqama        text,
  current_step int  default 1 check (current_step between 1 and 8),
  status       text default 'in_progress'
               check (status in ('in_progress','submitted','under_review','approved','rejected','flagged')),
  started_at   timestamptz default now(),
  submitted_at timestamptz,
  updated_at   timestamptz default now()
);

-- ── kyc_data ──────────────────────────────────────────────────────────────────
create table kyc_data (
  session_id uuid primary key references kyc_sessions(id) on delete cascade,

  -- Identity
  iqama             text,
  full_name         text,
  date_of_birth     text,
  nationality       text,
  other_nationality text,
  country_of_birth  text,
  city_of_birth     text,
  region_of_birth   text,

  -- Employment
  employment_status text,
  employer_name     text,
  government_sector text,
  profession        text,
  joining_date      text,
  education         text,

  -- Financial
  primary_source_of_income           text,
  income_range                       text,
  other_source_of_income             text,
  additional_income_source           text,
  additional_monthly_income_range    text,
  purpose_of_account                 text,
  account_currency                   text,
  expected_monthly_deposit_count     text,
  expected_monthly_deposit_amount    text,
  expected_monthly_withdrawal_count  text,
  expected_monthly_withdrawal_amount text,

  -- Contact & Additional
  mobile_number              text,
  home_phone                 text,
  has_residence_outside_ksa  boolean,
  residence_country          text,
  residence_postal           text,
  residence_street           text,
  residence_city             text,
  residence_district         text,
  has_immigrant_visa         boolean,
  visa_country               text,
  visa_type                  text,
  additional_contact         text,

  -- FATCA / CRS
  tax_resident_outside_ksa   boolean,
  tax_countries              jsonb,
  us_person                  boolean,
  ssn_itin_atin              text,
  is_pep                     boolean,
  pep_relationship           text,
  pep_declaration_note       text,

  -- National Address
  building_number   text,
  street            text,
  district          text,
  city              text,
  postal_code       text,
  additional_number text,
  unit_number       text,
  po_box            text,

  -- ELMNatheer result
  elm_result       boolean,
  elm_result_code  text,
  elm_checked_at   timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── audit_logs ────────────────────────────────────────────────────────────────
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid references kyc_sessions(id) on delete cascade,
  agent_id   text,
  action     text not null,
  notes      text,
  created_at timestamptz default now()
);

-- ── Indexes for common queries ────────────────────────────────────────────────
create index idx_kyc_sessions_status    on kyc_sessions(status);
create index idx_kyc_sessions_updated   on kyc_sessions(updated_at desc);
create index idx_kyc_sessions_iqama     on kyc_sessions(iqama);
create index idx_audit_logs_session     on audit_logs(session_id);

-- ── RLS: disabled for service_role key (backend uses service_role) ────────────
-- The backend always connects with the service_role key which bypasses RLS.
-- RLS is only relevant if you use the anon key from the frontend directly.
alter table kyc_sessions disable row level security;
alter table kyc_data     disable row level security;
alter table audit_logs   disable row level security;

-- ── Verify ────────────────────────────────────────────────────────────────────
select 'kyc_sessions' as table_name, count(*) from kyc_sessions
union all
select 'kyc_data',   count(*) from kyc_data
union all
select 'audit_logs', count(*) from audit_logs;