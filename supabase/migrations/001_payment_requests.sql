-- supabase/migrations/001_payment_requests.sql
-- Manual payment request table for SyncFrame Studio upgrade flow.
-- Run this in the Supabase SQL Editor for your project.

-- ============================================================
-- TABLE: admin_users
-- Simple admin registry — add admin user_id here to grant access.
-- ============================================================
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  added_at   timestamptz not null default now(),
  notes      text
);

alter table public.admin_users enable row level security;

drop policy if exists "admin_users_read_own" on public.admin_users;

-- Admins can read the admin_users table (to check their own admin status)
create policy "admin_users_read_own"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- ============================================================
-- TABLE: payment_requests
-- ============================================================
create table if not exists public.payment_requests (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  email                 text not null,
  full_name             text not null,
  requested_plan        text not null check (requested_plan in ('starter', 'pro', 'agency')),
  amount_pkr            integer not null,
  payment_method        text not null,
  transaction_reference text not null,
  notes                 text,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  reviewed_by           uuid references auth.users(id) on delete set null,
  reviewed_at           timestamptz,
  constraint check_plan_amount check (
    (requested_plan = 'starter' and amount_pkr = 499) or
    (requested_plan = 'pro' and amount_pkr = 1499) or
    (requested_plan = 'agency' and amount_pkr = 2999)
  )
);

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists payment_requests_updated_at on public.payment_requests;

create trigger payment_requests_updated_at
  before update on public.payment_requests
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists payment_requests_user_id_idx  on public.payment_requests(user_id);
create index if not exists payment_requests_status_idx   on public.payment_requests(status);
create index if not exists payment_requests_created_idx  on public.payment_requests(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.payment_requests enable row level security;

drop policy if exists "users_insert_own_payment_request" on public.payment_requests;
drop policy if exists "users_read_own_payment_requests" on public.payment_requests;
drop policy if exists "admin_read_all_payment_requests" on public.payment_requests;
drop policy if exists "admin_update_payment_requests" on public.payment_requests;

-- Users can insert their own requests
create policy "users_insert_own_payment_request"
  on public.payment_requests for insert
  with check (auth.uid() = user_id);

-- Users can read their own requests
create policy "users_read_own_payment_requests"
  on public.payment_requests for select
  using (auth.uid() = user_id);

-- Admin can read all requests
create policy "admin_read_all_payment_requests"
  on public.payment_requests for select
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- Admin can update status, reviewed_by, reviewed_at
create policy "admin_update_payment_requests"
  on public.payment_requests for update
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER: Add an admin user (run manually)
-- Replace 'your-user-uuid-here' with the actual UUID from auth.users
-- ============================================================
-- insert into public.admin_users (user_id, notes)
-- values ('your-user-uuid-here', 'Initial admin');
