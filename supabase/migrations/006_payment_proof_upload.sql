-- supabase/migrations/006_payment_proof_upload.sql
-- Final Architecture Hardening for Payment Checkout Flow

-- ============================================================
-- 1. Create Storage Bucket for Payment Proofs Idempotently
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false, -- private bucket
  8388608, -- 8 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================
-- 2. Add new columns to payment_requests & manage index safely
-- ============================================================

alter table public.payment_requests
  add column if not exists payment_proof_path text,
  add column if not exists phone_number text,
  add column if not exists contact_email text,
  add column if not exists idempotency_key uuid;

-- Drop the simple unique constraint if it exists from previous partial migration
alter table public.payment_requests drop constraint if exists payment_requests_idempotency_key_key;
alter table public.payment_requests drop constraint if exists payment_requests_idempotency_key_key1;

-- Create safe partial unique index for idempotency
create unique index if not exists payment_requests_idempotency_idx
  on public.payment_requests(user_id, idempotency_key)
  where idempotency_key is not null;

-- Create safe partial unique index for payment proof single-use
create unique index if not exists payment_requests_proof_idx
  on public.payment_requests(payment_proof_path)
  where payment_proof_path is not null;

-- ============================================================
-- 3. Cleanup old RPCs and Enforce RPC-only Inserts
-- ============================================================

-- Drop the old direct insert policy from migration 001 that bypasses the RPC
drop policy if exists "users_insert_own_payment_request" on public.payment_requests;

-- Explicitly revoke direct insert privileges to ensure canonical RPC is used
revoke insert on public.payment_requests from authenticated, anon;

drop function if exists public.submit_payment_request(text, text, uuid, text, text, text);
drop function if exists public.submit_payment_request(text, text, uuid, text, text, text, text, text);
drop function if exists public.validate_coupon_preview(text, text, integer);

-- ============================================================
-- 4. validate_coupon_preview RPC
-- ============================================================

create or replace function public.validate_coupon_preview(
  p_coupon_code text,
  p_plan_id     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coupon      public.coupons%rowtype;
  v_plan        public.plans%rowtype;
  v_base_amount integer;
  v_discount    integer := 0;
  v_final       integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;



  select * into v_plan from public.plans where id = p_plan_id and public_visible = true;
  if not found then
    raise exception 'Plan not found or unavailable for purchase';
  end if;
  v_base_amount := v_plan.price_pkr;

  select * into v_coupon
  from public.coupons
  where code = upper(trim(p_coupon_code))
    and active = true;

  if not found then
    raise exception 'Invalid or inactive coupon';
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < now() then
    raise exception 'Coupon has expired';
  end if;

  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    raise exception 'Coupon is not active yet';
  end if;

  if v_coupon.applies_to_plan is not null and v_coupon.applies_to_plan != p_plan_id then
    raise exception 'Coupon is not valid for this plan';
  end if;

  if v_coupon.max_redemptions is not null and v_coupon.redemption_count >= v_coupon.max_redemptions then
    raise exception 'Coupon redemption limit reached';
  end if;

  if v_coupon.discount_type = 'percent' then
    v_discount := (v_base_amount * v_coupon.discount_value) / 100;
  else
    v_discount := v_coupon.discount_value;
  end if;

  if v_discount > v_base_amount then v_discount := v_base_amount; end if;

  v_final := v_base_amount - v_discount;
  if v_final < 0 then v_final := 0; end if;

  return jsonb_build_object(
    'valid',          true,
    'base_amount',    v_base_amount,
    'discount_type',  v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'final_amount',   v_final,
    'description',    v_coupon.description
  );
end;
$$;

revoke execute on function public.validate_coupon_preview(text, text) from public, anon;
grant execute on function public.validate_coupon_preview(text, text) to authenticated;

-- ============================================================
-- 5. Canonical submit_payment_request RPC
-- ============================================================

create or replace function public.submit_payment_request(
  p_full_name             text,
  p_contact_email         text,
  p_phone_number          text,
  p_requested_plan        text,
  p_payment_account_id    uuid,
  p_transaction_reference text,
  p_notes                 text,
  p_coupon_code           text,
  p_payment_proof_path    text,
  p_idempotency_key       uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user          auth.users%rowtype;
  v_plan          public.plans%rowtype;
  v_account       public.payment_accounts%rowtype;
  v_coupon        public.coupons%rowtype;
  v_base_amount   integer;
  v_discount      integer := 0;
  v_final_amount  integer;
  v_request_id    uuid;
  v_existing      public.payment_requests%rowtype;

  v_cleaned_name  text;
  v_cleaned_email text;
  v_cleaned_phone text;
  v_cleaned_txn   text;
  v_cleaned_notes text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Idempotency Check & Transaction-Level Lock
  if p_idempotency_key is null then
    raise exception 'Idempotency key is required';
  end if;

  -- Safely queue concurrent requests from same user/key
  perform pg_advisory_xact_lock(
    hashtext('idemp_' || auth.uid()::text),
    hashtext(p_idempotency_key::text)
  );

  select * into v_existing from public.payment_requests
  where idempotency_key = p_idempotency_key and user_id = auth.uid();

  if found then
    return jsonb_build_object(
      'success',      true,
      'request_id',   v_existing.id,
      'base_amount',  v_existing.base_amount_pkr,
      'discount',     v_existing.discount_amount_pkr,
      'final_amount', v_existing.final_amount_pkr
    );
  end if;

  -- 2. Validate Inputs
  if p_full_name is null then
    raise exception 'Full name is required';
  end if;
  v_cleaned_name := trim(p_full_name);
  if length(v_cleaned_name) < 2 or length(v_cleaned_name) > 100 then
    raise exception 'Invalid full name (must be 2-100 characters)';
  end if;

  if p_contact_email is null then
    raise exception 'Contact email is required';
  end if;
  v_cleaned_email := trim(p_contact_email);
  if length(v_cleaned_email) > 254 or not (v_cleaned_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
    raise exception 'Invalid contact email format';
  end if;

  if p_phone_number is null then
    raise exception 'Phone number is required';
  end if;
  v_cleaned_phone := trim(p_phone_number);
  if length(v_cleaned_phone) > 30 or length(v_cleaned_phone) < 7 or not (v_cleaned_phone ~ '^\+?[0-9\-\s()]+$') then
    raise exception 'Invalid phone number format';
  end if;

  if p_transaction_reference is null then
    raise exception 'Transaction reference is required';
  end if;
  v_cleaned_txn := trim(p_transaction_reference);
  if length(v_cleaned_txn) < 4 or length(v_cleaned_txn) > 100 then
    raise exception 'Invalid transaction reference (must be 4-100 characters)';
  end if;

  if p_notes is not null and trim(p_notes) != '' then
    v_cleaned_notes := trim(p_notes);
    if length(v_cleaned_notes) > 500 then
      raise exception 'Notes cannot exceed 500 characters';
    end if;
  end if;



  -- 3. Payment Proof Verification (Single-Use & Existence)
  if p_payment_proof_path is not null then
    -- Validate exact structure: user-uuid/random-uuid.ext
    if not (p_payment_proof_path ~ ('^' || auth.uid()::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$')) then
      raise exception 'Invalid payment proof path format';
    end if;

    -- Concurrency Proof Lock
    perform pg_advisory_xact_lock(hashtext('proof_' || p_payment_proof_path));

    -- Verify it hasn't been used yet (single-use constraint)
    if exists (select 1 from public.payment_requests where payment_proof_path = p_payment_proof_path) then
      raise exception 'Payment proof has already been used by another request';
    end if;

    -- Verify it actually exists in storage
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'payment-proofs'
        and name = p_payment_proof_path
    ) then
      raise exception 'Payment proof file does not exist in storage';
    end if;
  end if;

  -- 4. Check Duplicate Transaction Reference (Concurrency-Safe)
  perform pg_advisory_xact_lock(
    hashtext('txref_' || p_payment_account_id::text),
    hashtext(lower(v_cleaned_txn))
  );

  if exists (
    select 1 from public.payment_requests
    where lower(transaction_reference) = lower(v_cleaned_txn)
      and payment_account_id = p_payment_account_id
      and status in ('pending', 'approved')
  ) then
    raise exception 'This transaction reference has already been submitted for this account.';
  end if;

  -- 5. Load DB Authoritative Data
  select * into v_user from auth.users where id = auth.uid();

  select * into v_plan from public.plans where id = p_requested_plan and public_visible = true;
  if not found then
    raise exception 'Plan not found or unavailable for purchase';
  end if;
  v_base_amount := v_plan.price_pkr;

  select * into v_account from public.payment_accounts where id = p_payment_account_id and active = true;
  if not found then
    raise exception 'Invalid or inactive payment account';
  end if;

  -- 6. Coupon validation & Atomic Locking
  if p_coupon_code is not null and trim(p_coupon_code) != '' then
    select * into v_coupon
    from public.coupons
    where code = upper(trim(p_coupon_code)) and active = true
    for update;

    if not found then
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

    if v_discount > v_base_amount then v_discount := v_base_amount; end if;

    update public.coupons
    set redemption_count = redemption_count + 1
    where id = v_coupon.id;
  end if;

  v_final_amount := v_base_amount - v_discount;
  if v_final_amount < 0 then v_final_amount := 0; end if;

  -- 7. Insert Request
  insert into public.payment_requests (
    user_id, email, full_name, requested_plan, amount_pkr, payment_method,
    transaction_reference, notes, status, base_amount_pkr, discount_amount_pkr,
    final_amount_pkr, coupon_code, payment_account_id, payment_proof_path, phone_number,
    contact_email, idempotency_key
  ) values (
    auth.uid(), v_user.email, v_cleaned_name, p_requested_plan, v_final_amount, v_account.method,
    v_cleaned_txn, v_cleaned_notes, 'pending', v_base_amount, v_discount,
    v_final_amount,
    case when p_coupon_code is null or trim(p_coupon_code) = '' then null else upper(trim(p_coupon_code)) end,
    p_payment_account_id,
    p_payment_proof_path,
    v_cleaned_phone,
    v_cleaned_email,
    p_idempotency_key
  ) returning id into v_request_id;

  return jsonb_build_object(
    'success',      true,
    'request_id',   v_request_id,
    'base_amount',  v_base_amount,
    'discount',     v_discount,
    'final_amount', v_final_amount
  );
end;
$$;

revoke execute on function public.submit_payment_request(text, text, text, text, uuid, text, text, text, text, uuid) from public, anon;
grant execute on function public.submit_payment_request(text, text, text, text, uuid, text, text, text, text, uuid) to authenticated;

-- ============================================================
-- 6. Supabase Storage Policies
-- ============================================================

drop policy if exists "payment_proofs_insert_own" on storage.objects;
drop policy if exists "payment_proofs_select_own" on storage.objects;
drop policy if exists "payment_proofs_admin_select" on storage.objects;
drop policy if exists "payment_proofs_delete_own_unused" on storage.objects;

-- Users can upload to their own folder (user_id/filename.ext)
create policy "payment_proofs_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own uploaded proof (during upload/preview)
create policy "payment_proofs_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins can read all proof uploads (for review)
create policy "payment_proofs_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.admin_users au where au.user_id = auth.uid()
    )
  );

-- Users can delete their own proofs IF NOT attached to a payment request (for cleanup on failed RPC)
create policy "payment_proofs_delete_own_unused"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1 from public.payment_requests pr
      where pr.payment_proof_path = name
    )
  );

notify pgrst, 'reload schema';
