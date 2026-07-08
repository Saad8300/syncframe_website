-- supabase/migrations/009_admin_user_details.sql
-- Additive migration to repair profile trigger and update admin users RPC

-- ============================================================
-- 1. Repair sync_new_auth_user_to_profile to include email
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
    email,
    full_name,
    phone_number,
    marketing_opt_in,
    marketing_opt_in_at,
    marketing_opt_in_source,
    created_at,
    updated_at
  ) values (
    new.id,
    new.email,
    v_name,
    v_phone,
    v_opt_in,
    v_opt_in_at,
    case when v_opt_in then 'signup' else null end,
    coalesce(new.created_at, now()),
    now()
  ) on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    phone_number = excluded.phone_number,
    marketing_opt_in = excluded.marketing_opt_in,
    marketing_opt_in_at = excluded.marketing_opt_in_at,
    marketing_opt_in_source = excluded.marketing_opt_in_source,
    updated_at = excluded.updated_at;

  return new;
end;
$$;
revoke execute on function public.sync_new_auth_user_to_profile() from public, anon, authenticated;

-- ============================================================
-- 2. Update admin_list_members RPC
-- ============================================================
drop function if exists public.admin_list_members(text, text, text);

create or replace function public.admin_list_members(
  p_search text default null,
  p_plan text default null,
  p_status text default null
)
returns table (
  user_id uuid,
  email text,
  full_name text,
  phone_number text,
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
    p.full_name,
    p.phone_number,
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
  left join public.profiles p on p.id = u.id
  left join public.subscriptions s on s.user_id = u.id
  left join public.credit_balances c on c.user_id = u.id
  where 
    (p_search is null or p_search = '' or u.email ilike '%' || p_search || '%' or u.id::text = p_search or p.full_name ilike '%' || p_search || '%' or p.phone_number ilike '%' || p_search || '%')
    and (p_plan is null or p_plan = '' or p_plan = 'all' or coalesce(s.plan_id, 'free') = p_plan)
    and (p_status is null or p_status = '' or p_status = 'all' or (p_status = 'active' and s.status in ('active', 'trialing')) or (p_status = 'cancelled' and s.status = 'cancelled'))
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members(text, text, text) from public, anon;
grant execute on function public.admin_list_members(text, text, text) to authenticated;
