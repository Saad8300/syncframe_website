-- supabase/migrations/007_app_release_storage.sql
-- Adds secure direct-upload storage for app release installers.
-- Safely replaces the old 12-argument admin_upsert_app_release function.

-- ============================================================
-- 1. Idempotent Bucket Creation (Private Bucket)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('app-releases', 'app-releases', false)
on conflict (id) do update set public = false;

-- ============================================================
-- 2. Schema Updates (Additive) & Direct Privileges
-- ============================================================

alter table public.app_releases
  alter column download_url drop not null;

alter table public.app_releases
  add column if not exists architecture text default 'x64';

-- Revoke dangerous direct access and grant only select
revoke all on public.app_releases from public, anon, authenticated;
grant select on public.app_releases to public, anon, authenticated;

-- Latest release uniqueness per platform/channel
create unique index if not exists app_releases_latest_idx
on public.app_releases (platform, channel)
where (is_latest = true);

-- ============================================================
-- 3. Safely Replace RPC: admin_upsert_app_release
-- Drop the original 12-argument signature exactly.
-- ============================================================

drop function if exists public.admin_upsert_app_release(
  uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean
);

drop function if exists public.admin_upsert_app_release(
  uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean, text, text
);

create or replace function public.admin_upsert_app_release(
  p_id              uuid,
  p_version         text,
  p_platform        text,
  p_channel         text,
  p_title           text,
  p_description     text,
  p_file_name       text,
  p_file_size_bytes bigint,
  p_download_url    text,
  p_release_notes   text,
  p_is_published    boolean,
  p_is_latest       boolean,
  p_storage_path    text,
  p_architecture    text
)
returns public.app_releases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.app_releases;
begin
  if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  -- Strict Metadata Validation
  if p_version is null or not (p_version ~ '^\d+\.\d+\.\d+$') then
    raise exception 'Version must be in format X.Y.Z';
  end if;
  if p_platform not in ('windows', 'mac') then
    raise exception 'Invalid platform';
  end if;
  if p_channel not in ('stable', 'beta') then
    raise exception 'Invalid channel';
  end if;
  if p_architecture not in ('x64', 'arm64', 'universal') then
    raise exception 'Invalid architecture';
  end if;
  if p_title is null or trim(p_title) = '' then
    raise exception 'Title is required';
  end if;

  if p_id is not null then
    select * into v_release from public.app_releases where id = p_id for update;
    if not found then
      raise exception 'Release not found';
    end if;

    -- Block metadata drift for managed storage releases
    if v_release.storage_path is not null then
      if p_platform != v_release.platform or p_channel != v_release.channel or p_version != v_release.version or p_architecture != v_release.architecture then
        raise exception 'Cannot change path-defining fields on a managed storage release without replacing the installer file';
      end if;
      if p_storage_path is not null and p_storage_path != v_release.storage_path then
        raise exception 'Cannot swap an existing managed storage_path. Use replacement upload flow.';
      end if;
    else
      if p_storage_path is not null then
        raise exception 'Cannot set storage_path on an existing legacy release. Use the replacement upload flow.';
      end if;
    end if;
  else
    if p_storage_path is not null then
      raise exception 'Cannot set storage_path on a new release. Use the replacement upload flow.';
    end if;
  end if;

  if p_is_latest = true then
    p_is_published := true;
    if (v_release.download_url is null and coalesce(p_download_url, '') = '') and (v_release.storage_path is null and coalesce(p_storage_path, '') = '') then
      raise exception 'Cannot mark release as latest without a valid download file or URL';
    end if;

    perform pg_advisory_xact_lock(hashtext('app_releases_latest'), hashtext(p_platform || '_' || p_channel));
    update public.app_releases
    set is_latest = false, updated_at = now()
    where platform = p_platform and channel = p_channel and is_latest = true
      and (p_id is null or id != p_id);
  end if;

  if p_id is not null then
    update public.app_releases set
      version         = p_version,
      platform        = p_platform,
      channel         = p_channel,
      title           = trim(p_title),
      description     = p_description,
      file_name       = p_file_name,
      file_size_bytes = p_file_size_bytes,
      download_url    = p_download_url,
      storage_path    = coalesce(p_storage_path, v_release.storage_path),
      release_notes   = p_release_notes,
      is_published    = p_is_published,
      is_latest       = p_is_latest,
      architecture    = p_architecture,
      updated_at      = now()
    where id = p_id
    returning * into v_release;
  else
    insert into public.app_releases (
      version, platform, channel, title, description, file_name, file_size_bytes,
      download_url, storage_path, release_notes, is_published, is_latest, architecture
    ) values (
      p_version, p_platform, p_channel, trim(p_title), p_description, p_file_name, p_file_size_bytes,
      p_download_url, p_storage_path, p_release_notes, p_is_published, p_is_latest, p_architecture
    ) returning * into v_release;
  end if;

  return v_release;
end;
$$;

revoke execute on function public.admin_upsert_app_release(uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean, text, text) from public, anon;
grant execute on function public.admin_upsert_app_release(uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean, text, text) to authenticated;

-- ============================================================
-- 4. New Upload Flow RPCs (Replaces weak attachment RPC)
-- ============================================================

drop function if exists public.admin_update_release_storage_path(uuid, text, text, bigint);

create or replace function public.admin_create_app_release_draft(
  p_platform text,
  p_channel text,
  p_version text,
  p_title text,
  p_architecture text
)
returns public.app_releases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.app_releases;
begin
  if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  if p_version is null or not (p_version ~ '^\d+\.\d+\.\d+$') then
    raise exception 'Version must be in format X.Y.Z';
  end if;
  if p_platform not in ('windows', 'mac') then
    raise exception 'Invalid platform';
  end if;
  if p_channel not in ('stable', 'beta') then
    raise exception 'Invalid channel';
  end if;
  if p_architecture not in ('x64', 'arm64', 'universal') then
    raise exception 'Invalid architecture';
  end if;
  if p_title is null or trim(p_title) = '' then
    raise exception 'Title is required';
  end if;

  insert into public.app_releases (
    version, platform, channel, title, is_published, is_latest, architecture
  ) values (
    p_version, p_platform, p_channel, trim(p_title), false, false, p_architecture
  ) returning * into v_release;

  return v_release;
end;
$$;

revoke execute on function public.admin_create_app_release_draft(text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_app_release_draft(text, text, text, text, text) to authenticated;

create or replace function public.admin_finalize_app_release_upload(
  p_release_id uuid,
  p_storage_path text,
  p_file_name text,
  p_file_size_bytes bigint,
  p_is_published boolean,
  p_is_latest boolean,
  p_platform text,
  p_channel text,
  p_version text,
  p_architecture text,
  p_title text,
  p_description text,
  p_release_notes text
)
returns public.app_releases
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release public.app_releases;
  v_expected_prefix text;
  v_filename text;
  v_upload_uuid text;
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
      raise exception 'Unauthorized';
    end if;

    select * into v_release from public.app_releases where id = p_release_id for update;
    if not found then
      raise exception 'Release not found';
    end if;

    if p_version is null or not (p_version ~ '^\d+\.\d+\.\d+$') then
      raise exception 'Version must be in format X.Y.Z';
    end if;
    if p_platform not in ('windows', 'mac') then
      raise exception 'Invalid platform';
    end if;
    if p_channel not in ('stable', 'beta') then
      raise exception 'Invalid channel';
    end if;
    if p_architecture not in ('x64', 'arm64', 'universal') then
      raise exception 'Invalid architecture';
    end if;
    if p_title is null or trim(p_title) = '' then
      raise exception 'Title is required';
    end if;

    if p_storage_path is null or trim(p_storage_path) = '' then
      raise exception 'Storage path is required';
    end if;

    -- Exact Path Validation Requirement
    v_expected_prefix := p_platform || '/' || p_channel || '/' || replace(p_version, 'v', '') || '/' || p_architecture || '/' || p_release_id || '/';

    if not (p_storage_path like v_expected_prefix || '%') then
      raise exception 'Storage path does not match expected prefix for this release';
    end if;

    v_filename := substr(p_storage_path, length(v_expected_prefix) + 1);

    if v_filename like '%/%' or v_filename like '%\%' or v_filename like '%..%' or v_filename = '' then
      raise exception 'Invalid storage path filename';
    end if;

    v_upload_uuid := substring(v_filename from '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-');
    if v_upload_uuid is null then
      raise exception 'Storage path filename must begin with a valid upload UUID followed by a hyphen';
    end if;

    if substring(v_filename from length(v_upload_uuid) + 2) != regexp_replace(p_file_name, '[^a-zA-Z0-9.\-_]', '-', 'g') then
      raise exception 'Storage path filename tail does not match deterministic sanitized file name';
    end if;

    if not exists (
      select 1 from storage.objects
      where bucket_id = 'app-releases' and name = p_storage_path
    ) then
      raise exception 'Storage object does not exist in app-releases bucket';
    end if;

    -- File Metadata Validation
    if p_file_name is null or trim(p_file_name) = '' then
      raise exception 'File name is required';
    end if;
    if p_file_name like '%/%' or p_file_name like '%\%' or p_file_name like '%..%' then
      raise exception 'Invalid file name format';
    end if;
    if p_file_size_bytes is null or p_file_size_bytes <= 0 then
      raise exception 'File size must be greater than zero';
    end if;

    if p_platform = 'windows' and not (p_file_name ilike '%.exe' or p_file_name ilike '%.msi' or p_file_name ilike '%.zip') then
      raise exception 'Invalid file extension for Windows';
    end if;
    if p_platform = 'mac' and not (p_file_name ilike '%.dmg' or p_file_name ilike '%.pkg' or p_file_name ilike '%.zip') then
      raise exception 'Invalid file extension for macOS';
    end if;

  if p_is_latest = true then
    p_is_published := true;
    perform pg_advisory_xact_lock(hashtext('app_releases_latest'), hashtext(p_platform || '_' || p_channel));
    update public.app_releases
    set is_latest = false, updated_at = now()
    where platform = p_platform and channel = p_channel and is_latest = true and id != p_release_id;
  end if;

  update public.app_releases set
    version         = p_version,
    platform        = p_platform,
    channel         = p_channel,
    title           = trim(p_title),
    description     = p_description,
    file_name       = p_file_name,
    file_size_bytes = p_file_size_bytes,
    download_url    = null,
    storage_path    = p_storage_path,
    release_notes   = p_release_notes,
    is_published    = p_is_published,
    is_latest       = p_is_latest,
    architecture    = p_architecture,
    updated_at      = now()
  where id = p_release_id
  returning * into v_release;

  return v_release;
end;
$$;

revoke execute on function public.admin_finalize_app_release_upload(uuid, text, text, bigint, boolean, boolean, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.admin_finalize_app_release_upload(uuid, text, text, bigint, boolean, boolean, text, text, text, text, text, text, text) to authenticated;

-- ============================================================
-- 5. Fix Latest RPC
-- ============================================================

create or replace function public.admin_set_latest_app_release(p_release_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_release public.app_releases;
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    select * into v_release from public.app_releases where id = p_release_id for update;

    if not found then
        raise exception 'Release not found';
    end if;

    if v_release.storage_path is null and v_release.download_url is null then
        raise exception 'Cannot mark release as latest without a valid download file or URL';
    end if;

    perform pg_advisory_xact_lock(hashtext('app_releases_latest'), hashtext(v_release.platform || '_' || v_release.channel));

    update public.app_releases
    set is_latest = false, updated_at = now()
    where platform = v_release.platform and channel = v_release.channel and is_latest = true and id != p_release_id;

    update public.app_releases
    set is_latest = true, is_published = true, updated_at = now()
    where id = p_release_id;
end;
$$;

revoke execute on function public.admin_set_latest_app_release(uuid) from public, anon;
grant execute on function public.admin_set_latest_app_release(uuid) to authenticated;

-- ============================================================
-- 6. Storage bucket RLS policies for app-releases
-- Admin INSERT, SELECT, DELETE
-- ============================================================

do $$
begin
  drop policy if exists "app_releases_admin_insert" on storage.objects;
  create policy "app_releases_admin_insert"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'app-releases'
      and exists (
        select 1 from public.admin_users au where au.user_id = auth.uid()
      )
    );

  drop policy if exists "app_releases_admin_select" on storage.objects;
  create policy "app_releases_admin_select"
    on storage.objects for select
    to authenticated
    using (
      bucket_id = 'app-releases'
      and exists (
        select 1 from public.admin_users au where au.user_id = auth.uid()
      )
    );

  drop policy if exists "app_releases_admin_delete" on storage.objects;
  create policy "app_releases_admin_delete"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'app-releases'
      and exists (
        select 1 from public.admin_users au where au.user_id = auth.uid()
      )
    );
end
$$;

notify pgrst, 'reload schema';
