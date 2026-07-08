-- supabase/migrations/008_user_profiles.sql
-- Additive migration to create a durable user profiles table.
-- Do not run in the local environment automatically if deploying via CI.

-- ============================================================
-- TABLE: profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or length(trim(full_name)) between 2 and 100),
  phone_number text check (phone_number is null or phone_number ~ '^\+?[0-9]{7,15}$'),
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  marketing_opt_in_source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_marketing_opt_in_consistency check (
    (marketing_opt_in = true and marketing_opt_in_at is not null and marketing_opt_in_source = 'signup') or
    (marketing_opt_in = false and marketing_opt_in_at is null and marketing_opt_in_source is null)
  )
);

alter table public.profiles enable row level security;

revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "users_read_own_profile" on public.profiles;

-- Users can read their own profile
create policy "users_read_own_profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

-- Trigger: auto-update updated_at for profiles
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_profiles_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- ============================================================
-- TRIGGER: sync_auth_to_profiles
-- Automatically create profile row when auth.users is inserted.
-- Extracts metadata from raw_user_meta_data safely.
-- ============================================================
create or replace function public.sync_new_auth_user_to_profile()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  v_opt_in boolean;
  v_opt_in_at timestamptz;
  v_name text;
  v_phone text;
begin
  -- Safely extract and cast marketing opt-in
  begin
    v_opt_in := (new.raw_user_meta_data->>'marketing_opt_in')::boolean;
  exception when others then
    v_opt_in := false;
  end;

  v_opt_in := coalesce(v_opt_in, false);

  if v_opt_in then
    v_opt_in_at := now();
  else
    v_opt_in_at := null;
  end if;

  -- Sanitize Full Name
  v_name := trim(new.raw_user_meta_data->>'full_name');
  if v_name = '' or length(v_name) < 2 or length(v_name) > 100 then
    v_name := null;
  end if;

  -- Normalize and Sanitize Phone Number
  v_phone := trim(new.raw_user_meta_data->>'phone_number');
  if v_phone is not null and v_phone != '' then
    if v_phone like '+%' then
      v_phone := '+' || regexp_replace(v_phone, '\D', '', 'g');
    else
      v_phone := regexp_replace(v_phone, '\D', '', 'g');
    end if;

    if v_phone !~ '^\+?[0-9]{7,15}$' then
      v_phone := null;
    end if;
  else
    v_phone := null;
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone_number,
    marketing_opt_in,
    marketing_opt_in_at,
    marketing_opt_in_source,
    created_at,
    updated_at
  ) values (
    new.id,
    v_name,
    v_phone,
    v_opt_in,
    v_opt_in_at,
    case when v_opt_in then 'signup' else null end,
    coalesce(new.created_at, now()),
    now()
  );

  return new;
end;
$$;
revoke execute on function public.sync_new_auth_user_to_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_sync_profile on auth.users;

create trigger on_auth_user_created_sync_profile
  after insert on auth.users
  for each row execute function public.sync_new_auth_user_to_profile();

-- ============================================================
-- BACKFILL: Existing users
-- Ensure existing users without a profile row get one.
-- ============================================================
insert into public.profiles (
  id,
  full_name,
  phone_number,
  marketing_opt_in,
  marketing_opt_in_at,
  marketing_opt_in_source,
  created_at
)
select
  u.id,
  case
    when length(trim(u.raw_user_meta_data->>'full_name')) between 2 and 100 then trim(u.raw_user_meta_data->>'full_name')
    else null
  end as full_name,
  case
    when trim(u.raw_user_meta_data->>'phone_number') like '+%'
      and ('+' || regexp_replace(trim(u.raw_user_meta_data->>'phone_number'), '\D', '', 'g')) ~ '^\+?[0-9]{7,15}$'
    then '+' || regexp_replace(trim(u.raw_user_meta_data->>'phone_number'), '\D', '', 'g')
    when trim(u.raw_user_meta_data->>'phone_number') not like '+%'
      and regexp_replace(trim(u.raw_user_meta_data->>'phone_number'), '\D', '', 'g') ~ '^[0-9]{7,15}$'
    then regexp_replace(trim(u.raw_user_meta_data->>'phone_number'), '\D', '', 'g')
    else null
  end as phone_number,
  false as marketing_opt_in,
  null as marketing_opt_in_at,
  null as marketing_opt_in_source,
  coalesce(u.created_at, now()) as created_at
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
