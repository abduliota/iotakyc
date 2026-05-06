-- ─────────────────────────────────────────────────────────────────────────────
-- IOTA KYC — Supabase Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Users table
create table if not exists users (
  id           uuid primary key default gen_random_uuid(),
  iqama        text unique not null,
  phone        text unique not null,
  otp_verified boolean default false,
  created_at   timestamptz default now()
);

-- KYC Sessions — tracks wizard progress
create table if not exists kyc_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references users(id) on delete cascade,
  current_step  int default 1 check (current_step between 1 and 8),
  status        text default 'in_progress'
                check (status in ('in_progress','submitted','under_review','approved','rejected','flagged')),
  started_at    timestamptz default now(),
  submitted_at  timestamptz,
  updated_at    timestamptz default now()
);

-- KYC Data — all collected fields, one row per session
create table if not exists kyc_data (
  session_id uuid primary key references kyc_sessions(id) on delete cascade,

  -- Step 1
  iqama text,

  -- Step 2: Personal Info
  full_name         text,
  date_of_birth     text,
  nationality       text,
  country_of_birth  text,
  city_of_birth     text,
  region_of_birth   text,
  other_nationality text,

  -- Step 3: National Address
  national_address_registered boolean,
  building_number   text,
  street            text,
  district          text,
  city              text,
  postal_code       text,
  additional_number text,
  unit_number       text,
  po_box            text,

  -- Step 4: Employment
  employment_status  text,
  employer_name      text,
  government_sector  text,
  profession         text,
  joining_date       text,
  education          text,

  -- Step 5: Financial
  income_range                       text,
  primary_source_of_income           text,
  additional_income                  boolean,
  additional_income_source           text,
  other_source_of_income             text,
  purpose_of_account                 text,
  account_currency                   text,
  expected_monthly_deposit_amount    text,
  expected_monthly_withdrawal_amount text,
  expected_monthly_deposit_count     text,
  expected_monthly_withdrawal_count  text,

  -- Step 6: Contact
  mobile_number              text,
  home_phone                 text,
  home_phone_country_code    text,
  additional_contact         text,
  contact_number_home_country text,

  -- Step 7: FATCA / CRS
  tax_resident_outside_ksa   boolean,
  tax_countries              jsonb,  -- array of TaxCountry objects
  us_person                  boolean,
  ssn_itin_atin              text,
  immigrant_visa_outside_ksa boolean,
  residence_outside_ksa      boolean,

  -- Step 7: PEP
  is_pep               boolean,
  pep_relationship     text,
  pep_declaration_note text,

  -- ELMNatheer Watchlist Result
  elm_result       boolean,
  elm_result_code  text,
  elm_checked_at   timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit Log — every agent action, timestamped
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references kyc_sessions(id) on delete cascade,
  agent_id    uuid,
  action      text not null,
  notes       text,
  created_at  timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table users        enable row level security;
alter table kyc_sessions enable row level security;
alter table kyc_data     enable row level security;
alter table audit_logs   enable row level security;

-- Customers can only see their own session
create policy "customer_own_session" on kyc_sessions
  for all using (user_id = auth.uid());

create policy "customer_own_data" on kyc_data
  for all using (
    session_id in (
      select id from kyc_sessions where user_id = auth.uid()
    )
  );

-- Agents can read all submitted sessions (role checked via JWT claim)
create policy "agent_read_submissions" on kyc_sessions
  for select using (
    auth.jwt() ->> 'role' in ('reviewer', 'manager', 'admin')
    and status != 'in_progress'
  );

create policy "agent_read_data" on kyc_data
  for select using (
    auth.jwt() ->> 'role' in ('reviewer', 'manager', 'admin')
  );

create policy "agent_write_audit" on audit_logs
  for insert with check (
    auth.jwt() ->> 'role' in ('reviewer', 'manager', 'admin')
  );
