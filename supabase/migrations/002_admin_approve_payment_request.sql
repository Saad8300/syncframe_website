-- supabase/migrations/002_admin_approve_payment_request.sql

-- ============================================================
-- FUNCTION: approve_payment_request
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
  -- 1. Check auth.uid() is not null
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. Check auth.uid() exists in public.admin_users
  select user_id into v_admin_id from public.admin_users where user_id = auth.uid();
  if v_admin_id is null then
    raise exception 'Not authorized: admin access required';
  end if;

  -- 3. Load payment_requests row
  select * into v_request from public.payment_requests where id = p_request_id;
  if v_request is null then
    raise exception 'Payment request not found';
  end if;

  -- 4. Ensure request status is pending
  if v_request.status != 'pending' then
    raise exception 'Payment request is not pending (current status: %)', v_request.status;
  end if;

  -- 5. Validate requested_plan & 6. Validate amount_pkr & 7. Determine monthly credits
  if v_request.requested_plan = 'starter' then
    if v_request.amount_pkr != 499 then
      raise exception 'Invalid amount for starter plan';
    end if;
    v_credits := 1500;
  elsif v_request.requested_plan = 'pro' then
    if v_request.amount_pkr != 1499 then
      raise exception 'Invalid amount for pro plan';
    end if;
    v_credits := 6000;
  elsif v_request.requested_plan = 'agency' then
    if v_request.amount_pkr != 2999 then
      raise exception 'Invalid amount for agency plan';
    end if;
    v_credits := 10000;
  else
    raise exception 'Invalid requested_plan: %', v_request.requested_plan;
  end if;

  v_period_end := now() + interval '1 month';

  -- 8. Update payment_requests
  update public.payment_requests
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  -- 9. Update or create public.subscriptions
  insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  values (v_request.user_id, v_request.requested_plan, 'active', now(), v_period_end)
  on conflict (user_id) do update
  set plan_id = excluded.plan_id,
      status = excluded.status,
      current_period_start = excluded.current_period_start,
      current_period_end = excluded.current_period_end;

  -- 10. Update or create public.credit_balances
  insert into public.credit_balances (user_id, balance, monthly_allocation, lifetime_used, next_reset_at)
  values (v_request.user_id, v_credits, v_credits, 0, v_period_end)
  on conflict (user_id) do update
  set balance = excluded.balance,
      monthly_allocation = excluded.monthly_allocation,
      next_reset_at = excluded.next_reset_at;

  -- 11. Return a clean JSON result
  return jsonb_build_object(
    'success', true,
    'user_id', v_request.user_id,
    'plan_id', v_request.requested_plan,
    'credits', v_credits,
    'current_period_end', v_period_end
  );
end;
$$;

-- Grant execution
revoke execute on function public.approve_payment_request(uuid) from public;
grant execute on function public.approve_payment_request(uuid) to authenticated;


-- ============================================================
-- FUNCTION: reject_payment_request
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
  -- 1. Check auth.uid() is not null
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- 2. Check auth.uid() exists in public.admin_users
  select user_id into v_admin_id from public.admin_users where user_id = auth.uid();
  if v_admin_id is null then
    raise exception 'Not authorized: admin access required';
  end if;

  -- 3. Load payment_requests row
  select * into v_request from public.payment_requests where id = p_request_id;
  if v_request is null then
    raise exception 'Payment request not found';
  end if;

  -- 4. Ensure request status is pending
  if v_request.status != 'pending' then
    raise exception 'Payment request is not pending (current status: %)', v_request.status;
  end if;

  -- 5. Update payment_requests
  update public.payment_requests
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'success', true,
    'user_id', v_request.user_id,
    'status', 'rejected'
  );
end;
$$;

-- Grant execution
revoke execute on function public.reject_payment_request(uuid) from public;
grant execute on function public.reject_payment_request(uuid) to authenticated;
