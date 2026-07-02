-- supabase/migrations/004_admin_commerce_settings.sql

-- 1. Modify Plans
alter table public.plans
  add column if not exists price_pkr integer default 0,
  add column if not exists price_label text,
  add column if not exists billing_interval text default 'month',
  add column if not exists short_description text,
  add column if not exists features_json jsonb default '[]'::jsonb,
  add column if not exists is_popular boolean default false,
  add column if not exists public_visible boolean default true,
  add column if not exists updated_at timestamptz default now();

-- Update initial values based on existing defaults
update public.plans set price_pkr = 0, price_label = 'Free Trial', billing_interval = 'none', short_description = '30 one-time credits, no monthly renewal', is_popular = false, public_visible = true where id = 'free';
update public.plans set price_pkr = 499, price_label = 'Rs 499', billing_interval = 'month', short_description = '1,500 credits / month', is_popular = false, public_visible = true where id = 'starter';
update public.plans set price_pkr = 1499, price_label = 'Rs 1,499', billing_interval = 'month', short_description = '6,000 credits / month', is_popular = false, public_visible = true where id = 'pro';
update public.plans set price_pkr = 2999, price_label = 'Rs 2,999', billing_interval = 'month', short_description = '10,000 credits / month', is_popular = true, public_visible = true where id = 'agency';

-- RPC: admin_update_plan_settings
create or replace function public.admin_update_plan_settings(
  p_plan_id text,
  p_price_pkr integer,
  p_monthly_credits integer,
  p_display_name text default null,
  p_short_description text default null,
  p_features_json jsonb default null,
  p_is_popular boolean default null,
  p_public_visible boolean default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  if p_plan_id not in ('free', 'starter', 'pro', 'agency') then
    raise exception 'Invalid plan id: %', p_plan_id;
  end if;

  if p_price_pkr < 0 or p_monthly_credits < 0 then
    raise exception 'Price and credits must be >= 0';
  end if;

  update public.plans
  set price_pkr = p_price_pkr,
      monthly_credits = p_monthly_credits,
      display_name = coalesce(p_display_name, display_name),
      short_description = coalesce(p_short_description, short_description),
      features_json = coalesce(p_features_json, features_json),
      is_popular = coalesce(p_is_popular, is_popular),
      public_visible = coalesce(p_public_visible, public_visible),
      updated_at = now()
  where id = p_plan_id;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, new_value, reason)
  values (auth.uid(), auth.uid(), 'plan_settings_updated', jsonb_build_object('plan_id', p_plan_id, 'price_pkr', p_price_pkr, 'monthly_credits', p_monthly_credits), p_reason);

  return jsonb_build_object('success', true);
end;
$$;
revoke execute on function public.admin_update_plan_settings(text, integer, integer, text, text, jsonb, boolean, boolean, text) from public;
grant execute on function public.admin_update_plan_settings(text, integer, integer, text, text, jsonb, boolean, boolean, text) to authenticated;

-- 2. Coupons Table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value integer not null,
  applies_to_plan text check (applies_to_plan in ('starter','pro','agency')),
  active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_redemptions integer,
  redemption_count integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.coupons enable row level security;
drop policy if exists "admin_read_coupons" on public.coupons;
create policy "admin_read_coupons" on public.coupons for select using (
  exists (
    select 1 from public.admin_users au where au.user_id = auth.uid()
  )
);

-- Admin Coupon RPCs
create or replace function public.admin_list_coupons()
returns setof public.coupons
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;
  
  return query select * from public.coupons order by created_at desc;
end;
$$;
revoke execute on function public.admin_list_coupons() from public;
grant execute on function public.admin_list_coupons() to authenticated;

create or replace function public.admin_upsert_coupon(
  p_id uuid,
  p_code text,
  p_description text,
  p_discount_type text,
  p_discount_value integer,
  p_applies_to_plan text,
  p_active boolean,
  p_expires_at timestamptz,
  p_max_redemptions integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_clean_code text;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  v_clean_code := upper(trim(p_code));
  if length(v_clean_code) = 0 then
    raise exception 'Coupon code cannot be empty';
  end if;

  if p_discount_type = 'percent' and (p_discount_value < 1 or p_discount_value > 100) then
    raise exception 'Percent discount must be 1-100';
  end if;
  if p_discount_type = 'fixed' and p_discount_value < 1 then
    raise exception 'Fixed discount must be >= 1';
  end if;

  if p_id is null then
    insert into public.coupons (code, description, discount_type, discount_value, applies_to_plan, active, expires_at, max_redemptions)
    values (v_clean_code, p_description, p_discount_type, p_discount_value, p_applies_to_plan, p_active, p_expires_at, p_max_redemptions);
  else
    update public.coupons
    set code = v_clean_code,
        description = p_description,
        discount_type = p_discount_type,
        discount_value = p_discount_value,
        applies_to_plan = p_applies_to_plan,
        active = p_active,
        expires_at = p_expires_at,
        max_redemptions = p_max_redemptions,
        updated_at = now()
    where id = p_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
revoke execute on function public.admin_upsert_coupon(uuid, text, text, text, integer, text, boolean, timestamptz, integer) from public;
grant execute on function public.admin_upsert_coupon(uuid, text, text, text, integer, text, boolean, timestamptz, integer) to authenticated;

-- Payment Accounts
create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('JazzCash','EasyPaisa','Bank Transfer','Other')),
  account_title text not null,
  account_number text not null,
  bank_name text,
  iban text,
  instructions text,
  active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_accounts enable row level security;
drop policy if exists "users_read_active_payment_accounts" on public.payment_accounts;
create policy "users_read_active_payment_accounts"
on public.payment_accounts for select
using (active = true);

-- Admin Payment Accounts RPCs
create or replace function public.admin_list_payment_accounts()
returns setof public.payment_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;
  return query select * from public.payment_accounts order by sort_order asc, created_at desc;
end;
$$;
revoke execute on function public.admin_list_payment_accounts() from public;
grant execute on function public.admin_list_payment_accounts() to authenticated;

create or replace function public.admin_upsert_payment_account(
  p_id uuid,
  p_method text,
  p_account_title text,
  p_account_number text,
  p_bank_name text,
  p_iban text,
  p_instructions text,
  p_active boolean,
  p_sort_order integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  if p_id is null then
    insert into public.payment_accounts (method, account_title, account_number, bank_name, iban, instructions, active, sort_order)
    values (p_method, p_account_title, p_account_number, p_bank_name, p_iban, p_instructions, p_active, p_sort_order);
  else
    update public.payment_accounts
    set method = p_method,
        account_title = p_account_title,
        account_number = p_account_number,
        bank_name = p_bank_name,
        iban = p_iban,
        instructions = p_instructions,
        active = p_active,
        sort_order = p_sort_order,
        updated_at = now()
    where id = p_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
revoke execute on function public.admin_upsert_payment_account(uuid, text, text, text, text, text, text, boolean, integer) from public;
grant execute on function public.admin_upsert_payment_account(uuid, text, text, text, text, text, text, boolean, integer) to authenticated;

-- Modify payment_requests table
alter table public.payment_requests
  drop constraint if exists check_plan_amount;
alter table public.payment_requests
  drop constraint if exists payment_requests_amount_matches_plan;

alter table public.payment_requests
  add column if not exists base_amount_pkr integer,
  add column if not exists discount_amount_pkr integer default 0,
  add column if not exists final_amount_pkr integer,
  add column if not exists coupon_code text,
  add column if not exists payment_account_id uuid references public.payment_accounts(id);

-- Update existing rows to have base and final amounts if missing
update public.payment_requests 
set base_amount_pkr = amount_pkr, final_amount_pkr = amount_pkr 
where base_amount_pkr is null;

-- submit_payment_request RPC
create or replace function public.submit_payment_request(
  p_full_name text,
  p_requested_plan text,
  p_payment_account_id uuid,
  p_transaction_reference text,
  p_notes text default null,
  p_coupon_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user auth.users%rowtype;
  v_plan public.plans%rowtype;
  v_account public.payment_accounts%rowtype;
  v_coupon public.coupons%rowtype;
  v_base_amount integer;
  v_discount integer := 0;
  v_final_amount integer;
  v_request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  
  select * into v_user from auth.users where id = auth.uid();

  if p_requested_plan not in ('starter', 'pro', 'agency') then
    raise exception 'Invalid plan';
  end if;

  select * into v_plan from public.plans where id = p_requested_plan;
  if v_plan is null then
    raise exception 'Plan not found';
  end if;
  v_base_amount := v_plan.price_pkr;

  select * into v_account from public.payment_accounts where id = p_payment_account_id and active = true;
  if v_account is null then
    raise exception 'Invalid or inactive payment account';
  end if;

  if p_coupon_code is not null and trim(p_coupon_code) != '' then
    select * into v_coupon from public.coupons where code = upper(trim(p_coupon_code)) and active = true;
    if v_coupon is null then
      raise exception 'Invalid or inactive coupon';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
      raise exception 'Coupon expired';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception 'Coupon is not active yet';
    end if;
    if v_coupon.applies_to_plan is not null and v_coupon.applies_to_plan != p_requested_plan then
      raise exception 'Coupon not valid for this plan';
    end if;
    if v_coupon.max_redemptions is not null and v_coupon.redemption_count >= v_coupon.max_redemptions then
      raise exception 'Coupon max redemptions reached';
    end if;

    if v_coupon.discount_type = 'percent' then
      v_discount := (v_base_amount * v_coupon.discount_value) / 100;
    else
      v_discount := v_coupon.discount_value;
    end if;
    
    if v_discount > v_base_amount then
      v_discount := v_base_amount;
    end if;
    
    update public.coupons set redemption_count = redemption_count + 1 where id = v_coupon.id;
  end if;

  v_final_amount := v_base_amount - v_discount;
  if v_final_amount < 0 then
    v_final_amount := 0;
  end if;

  insert into public.payment_requests (
    user_id, email, full_name, requested_plan, amount_pkr, payment_method, 
    transaction_reference, notes, status, base_amount_pkr, discount_amount_pkr, 
    final_amount_pkr, coupon_code, payment_account_id
  ) values (
    auth.uid(), v_user.email, p_full_name, p_requested_plan, v_final_amount, v_account.method,
    p_transaction_reference, p_notes, 'pending', v_base_amount, v_discount,
    v_final_amount, case when p_coupon_code is null or trim(p_coupon_code) = '' then null else upper(trim(p_coupon_code)) end, p_payment_account_id
  ) returning id into v_request_id;

  return jsonb_build_object(
    'success', true, 
    'request_id', v_request_id,
    'base_amount', v_base_amount,
    'discount', v_discount,
    'final_amount', v_final_amount
  );
end;
$$;
revoke execute on function public.submit_payment_request(text, text, uuid, text, text, text) from public;
grant execute on function public.submit_payment_request(text, text, uuid, text, text, text) to authenticated;


-- Update approve_payment_request to not hardcode prices/credits
create or replace function public.approve_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_request public.payment_requests%rowtype;
  v_plan public.plans%rowtype;
  v_credits int;
  v_period_end timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select au.user_id into v_admin_id from public.admin_users au where au.user_id = auth.uid();
  if v_admin_id is null then
    raise exception 'Not authorized: admin access required';
  end if;

  select * into v_request from public.payment_requests where id = p_request_id;
  if v_request is null then
    raise exception 'Payment request not found';
  end if;

  if v_request.status != 'pending' then
    raise exception 'Payment request is not pending (current status: %)', v_request.status;
  end if;

  select * into v_plan from public.plans where id = v_request.requested_plan;
  if v_plan is null then
    raise exception 'Requested plan not found in system';
  end if;
  
  v_credits := v_plan.monthly_credits;
  v_period_end := now() + interval '1 month';

  update public.payment_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  values (v_request.user_id, v_request.requested_plan, 'active', now(), v_period_end)
  on conflict (user_id) do update
  set plan_id = excluded.plan_id,
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end;

  insert into public.credit_balances (user_id, balance, monthly_allocation, lifetime_used, next_reset_at)
  values (v_request.user_id, v_credits, v_credits, 0, v_period_end)
  on conflict (user_id) do update
  set balance = excluded.balance,
      monthly_allocation = excluded.monthly_allocation,
      next_reset_at = excluded.next_reset_at;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, new_value, reason)
  values (auth.uid(), v_request.user_id, 'payment_approved', jsonb_build_object('plan_id', v_request.requested_plan, 'request_id', p_request_id), 'Payment approved via Admin Panel');

  return jsonb_build_object('success', true, 'user_id', v_request.user_id, 'plan_id', v_request.requested_plan, 'credits', v_credits, 'current_period_end', v_period_end);
end;
$$;

notify pgrst, 'reload schema';
