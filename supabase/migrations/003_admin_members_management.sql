-- supabase/migrations/003_admin_members_management.sql
-- Run this in the Supabase SQL Editor.

-- ============================================================
-- 1. Audit Logs Table
-- ============================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_read_audit_logs" on public.admin_audit_logs;
create policy "admin_read_audit_logs"
  on public.admin_audit_logs for select
  using (
    exists (
      select 1 from public.admin_users
      where admin_users.user_id = auth.uid()
    )
  );

-- ============================================================
-- RPC: admin_list_members
-- ============================================================
create or replace function public.admin_list_members(
  p_search text default null,
  p_plan text default null,
  p_status text default null
)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  plan_id text,
  subscription_status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  balance integer,
  monthly_allocation integer,
  lifetime_used integer,
  next_reset_at timestamptz,
  recent_usage_count integer,
  last_usage_at timestamptz
)
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

  return query
  select 
    u.id as user_id,
    u.email::text as email,
    u.created_at,
    coalesce(s.plan_id, 'free') as plan_id,
    coalesce(s.status, 'inactive') as subscription_status,
    s.current_period_start,
    s.current_period_end,
    coalesce(c.balance, 0) as balance,
    coalesce(c.monthly_allocation, 0) as monthly_allocation,
    coalesce(c.lifetime_used, 0) as lifetime_used,
    c.next_reset_at,
    (select count(*)::int from public.usage_jobs uj where uj.user_id = u.id and uj.created_at >= now() - interval '30 days') as recent_usage_count,
    (select max(uj.created_at) from public.usage_jobs uj where uj.user_id = u.id) as last_usage_at
  from auth.users u
  left join public.subscriptions s on s.user_id = u.id
  left join public.credit_balances c on c.user_id = u.id
  where 
    (p_search is null or p_search = '' or u.email ilike '%' || p_search || '%' or u.id::text = p_search)
    and (p_plan is null or p_plan = '' or p_plan = 'all' or coalesce(s.plan_id, 'free') = p_plan)
    and (p_status is null or p_status = '' or p_status = 'all' or (p_status = 'active' and s.status in ('active', 'trialing')) or (p_status = 'cancelled' and s.status = 'cancelled'))
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members(text, text, text) from public;
grant execute on function public.admin_list_members(text, text, text) to authenticated;

-- ============================================================
-- RPC: admin_adjust_user_credits
-- ============================================================
create or replace function public.admin_adjust_user_credits(
  p_user_id uuid,
  p_delta integer,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_old_balance integer;
  v_new_balance integer;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  select cb.balance into v_old_balance from public.credit_balances cb where cb.user_id = p_user_id;
  if v_old_balance is null then
    raise exception 'User credit balance not found';
  end if;

  v_new_balance := v_old_balance + p_delta;
  if v_new_balance < 0 then
    raise exception 'Credit balance cannot be less than 0. Current: %, Delta: %', v_old_balance, p_delta;
  end if;

  update public.credit_balances cb
  set balance = v_new_balance
  where cb.user_id = p_user_id;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, old_value, new_value, reason)
  values (auth.uid(), p_user_id, 'credit_adjustment', jsonb_build_object('balance', v_old_balance), jsonb_build_object('balance', v_new_balance, 'delta', p_delta), p_reason);

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_balance', v_old_balance,
    'new_balance', v_new_balance,
    'delta', p_delta
  );
end;
$$;

revoke execute on function public.admin_adjust_user_credits(uuid, integer, text) from public;
grant execute on function public.admin_adjust_user_credits(uuid, integer, text) to authenticated;

-- ============================================================
-- RPC: admin_set_user_credits
-- ============================================================
create or replace function public.admin_set_user_credits(
  p_user_id uuid,
  p_new_balance integer,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_old_balance integer;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  if p_new_balance < 0 then
    raise exception 'Credit balance cannot be less than 0';
  end if;

  select cb.balance into v_old_balance from public.credit_balances cb where cb.user_id = p_user_id;
  if v_old_balance is null then
    raise exception 'User credit balance not found';
  end if;

  update public.credit_balances cb
  set balance = p_new_balance
  where cb.user_id = p_user_id;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, old_value, new_value, reason)
  values (auth.uid(), p_user_id, 'credit_set', jsonb_build_object('balance', v_old_balance), jsonb_build_object('balance', p_new_balance), p_reason);

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_balance', v_old_balance,
    'new_balance', p_new_balance
  );
end;
$$;

revoke execute on function public.admin_set_user_credits(uuid, integer, text) from public;
grant execute on function public.admin_set_user_credits(uuid, integer, text) to authenticated;

-- ============================================================
-- RPC: admin_cancel_user_subscription
-- ============================================================
create or replace function public.admin_cancel_user_subscription(
  p_user_id uuid,
  p_reason text default null,
  p_zero_credits boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_old_sub public.subscriptions%rowtype;
begin
  select exists(select 1 from public.admin_users au where au.user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'Not authorized: admin access required';
  end if;

  select * into v_old_sub from public.subscriptions s where s.user_id = p_user_id;
  if v_old_sub is null then
    raise exception 'Subscription not found';
  end if;

  update public.subscriptions s
  set plan_id = 'free',
      status = 'cancelled',
      current_period_end = now()
  where s.user_id = p_user_id;

  if p_zero_credits then
    update public.credit_balances cb
    set balance = 0,
        monthly_allocation = 0,
        next_reset_at = null
    where cb.user_id = p_user_id;
  end if;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, old_value, new_value, reason)
  values (auth.uid(), p_user_id, 'subscription_cancelled', jsonb_build_object('plan', v_old_sub.plan_id, 'status', v_old_sub.status), jsonb_build_object('plan', 'free', 'status', 'cancelled', 'credits_zeroed', p_zero_credits), p_reason);

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'previous_plan', v_old_sub.plan_id,
    'new_plan', 'free',
    'credits_zeroed', p_zero_credits
  );
end;
$$;

revoke execute on function public.admin_cancel_user_subscription(uuid, text, boolean) from public;
grant execute on function public.admin_cancel_user_subscription(uuid, text, boolean) to authenticated;

-- ============================================================
-- Update approve_payment_request to log audit
-- ============================================================
create or replace function public.approve_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_request public.payment_requests%rowtype;
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

  if v_request.requested_plan = 'starter' then
    if v_request.amount_pkr != 499 then raise exception 'Invalid amount for starter plan'; end if;
    v_credits := 1500;
  elsif v_request.requested_plan = 'pro' then
    if v_request.amount_pkr != 1499 then raise exception 'Invalid amount for pro plan'; end if;
    v_credits := 6000;
  elsif v_request.requested_plan = 'agency' then
    if v_request.amount_pkr != 2999 then raise exception 'Invalid amount for agency plan'; end if;
    v_credits := 10000;
  else
    raise exception 'Invalid requested_plan: %', v_request.requested_plan;
  end if;

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

-- ============================================================
-- Update reject_payment_request to log audit
-- ============================================================
create or replace function public.reject_payment_request(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_request public.payment_requests%rowtype;
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
    raise exception 'Payment request is not pending';
  end if;

  update public.payment_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  insert into public.admin_audit_logs (admin_user_id, target_user_id, action, new_value, reason)
  values (auth.uid(), v_request.user_id, 'payment_rejected', jsonb_build_object('plan_id', v_request.requested_plan, 'request_id', p_request_id), 'Payment rejected via Admin Panel');

  return jsonb_build_object('success', true, 'user_id', v_request.user_id);
end;
$$;

-- ============================================================
-- RELOAD SCHEMA
-- ============================================================
notify pgrst, 'reload schema';
