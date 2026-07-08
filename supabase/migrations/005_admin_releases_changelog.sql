-- 005_admin_releases_changelog.sql

-- ==========================================
-- Part 1: App Releases
-- ==========================================

create table if not exists public.app_releases (
    id uuid primary key default gen_random_uuid(),
    version text not null,
    platform text not null check (platform in ('windows', 'mac')),
    channel text not null default 'stable' check (channel in ('stable', 'beta')),
    title text not null,
    description text,
    file_name text,
    file_size_bytes bigint,
    download_url text not null,
    storage_path text,
    checksum_sha256 text,
    is_latest boolean not null default false,
    is_published boolean not null default true,
    release_notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.app_releases enable row level security;

drop policy if exists "Public can read published app releases" on public.app_releases;
create policy "Public can read published app releases"
    on public.app_releases for select
    to public
    using (is_published = true);

create or replace function public.admin_list_app_releases()
returns setof public.app_releases
language sql
security definer
set search_path = public
as $$
    select * from public.app_releases
    where exists (
        select 1 from public.admin_users au where au.user_id = auth.uid()
    )
    order by created_at desc;
$$;

create or replace function public.admin_upsert_app_release(
    p_id uuid,
    p_version text,
    p_platform text,
    p_channel text,
    p_title text,
    p_description text,
    p_file_name text,
    p_file_size_bytes bigint,
    p_download_url text,
    p_release_notes text,
    p_is_published boolean,
    p_is_latest boolean
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

    if p_is_latest = true then
        p_is_published := true;
        update public.app_releases
        set is_latest = false, updated_at = now()
        where platform = p_platform and channel = p_channel and is_latest = true;
    end if;

    if p_id is not null then
        update public.app_releases set
            version = p_version,
            platform = p_platform,
            channel = p_channel,
            title = p_title,
            description = p_description,
            file_name = p_file_name,
            file_size_bytes = p_file_size_bytes,
            download_url = p_download_url,
            release_notes = p_release_notes,
            is_published = p_is_published,
            is_latest = p_is_latest,
            updated_at = now()
        where id = p_id
        returning * into v_release;
    else
        insert into public.app_releases (
            version, platform, channel, title, description, file_name, file_size_bytes,
            download_url, release_notes, is_published, is_latest
        ) values (
            p_version, p_platform, p_channel, p_title, p_description, p_file_name, p_file_size_bytes,
            p_download_url, p_release_notes, p_is_published, p_is_latest
        ) returning * into v_release;
    end if;

    return v_release;
end;
$$;

create or replace function public.admin_delete_app_release(p_release_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    delete from public.app_releases where id = p_release_id;
end;
$$;

create or replace function public.admin_set_latest_app_release(p_release_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_platform text;
    v_channel text;
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    select platform, channel into v_platform, v_channel
    from public.app_releases where id = p_release_id;

    if not found then
        raise exception 'Release not found';
    end if;

    update public.app_releases
    set is_latest = false, updated_at = now()
    where platform = v_platform and channel = v_channel and is_latest = true;

    update public.app_releases
    set is_latest = true, is_published = true, updated_at = now()
    where id = p_release_id;
end;
$$;

-- ==========================================
-- Part 2: Changelog Entries
-- ==========================================

create table if not exists public.changelog_entries (
    id uuid primary key default gen_random_uuid(),
    version text not null,
    title text not null,
    summary text,
    content text not null,
    category text default 'release' check (category in ('release','feature','fix','security','improvement')),
    tags text[] default '{}',
    published boolean not null default true,
    published_at timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.changelog_entries enable row level security;

drop policy if exists "Public can read published changelog entries" on public.changelog_entries;
create policy "Public can read published changelog entries"
    on public.changelog_entries for select
    to public
    using (published = true);

create or replace function public.admin_list_changelog_entries()
returns setof public.changelog_entries
language sql
security definer
set search_path = public
as $$
    select * from public.changelog_entries
    where exists (
        select 1 from public.admin_users au where au.user_id = auth.uid()
    )
    order by published_at desc nulls last, created_at desc;
$$;

create or replace function public.admin_upsert_changelog_entry(
    p_id uuid,
    p_version text,
    p_title text,
    p_summary text,
    p_content text,
    p_category text,
    p_tags text[],
    p_published boolean
)
returns public.changelog_entries
language plpgsql
security definer
set search_path = public
as $$
declare
    v_entry public.changelog_entries;
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    if p_id is not null then
        update public.changelog_entries set
            version = p_version,
            title = p_title,
            summary = p_summary,
            content = p_content,
            category = p_category,
            tags = p_tags,
            published = p_published,
            published_at = case when p_published and not published then now() else published_at end,
            updated_at = now()
        where id = p_id
        returning * into v_entry;
    else
        insert into public.changelog_entries (
            version, title, summary, content, category, tags, published, published_at
        ) values (
            p_version, p_title, p_summary, p_content, p_category, p_tags, p_published,
            case when p_published then now() else null end
        ) returning * into v_entry;
    end if;

    return v_entry;
end;
$$;

create or replace function public.admin_delete_changelog_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (select 1 from public.admin_users au where au.user_id = auth.uid()) then
        raise exception 'Unauthorized';
    end if;

    delete from public.changelog_entries where id = p_entry_id;
end;
$$;

-- Revoke and Grant Permissions
revoke execute on function public.admin_list_app_releases() from public, anon;
revoke execute on function public.admin_upsert_app_release(uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean) from public, anon;
revoke execute on function public.admin_delete_app_release(uuid) from public, anon;
revoke execute on function public.admin_set_latest_app_release(uuid) from public, anon;

grant execute on function public.admin_list_app_releases() to authenticated;
grant execute on function public.admin_upsert_app_release(uuid, text, text, text, text, text, text, bigint, text, text, boolean, boolean) to authenticated;
grant execute on function public.admin_delete_app_release(uuid) to authenticated;
grant execute on function public.admin_set_latest_app_release(uuid) to authenticated;

revoke execute on function public.admin_list_changelog_entries() from public, anon;
revoke execute on function public.admin_upsert_changelog_entry(uuid, text, text, text, text, text, text[], boolean) from public, anon;
revoke execute on function public.admin_delete_changelog_entry(uuid) from public, anon;

grant execute on function public.admin_list_changelog_entries() to authenticated;
grant execute on function public.admin_upsert_changelog_entry(uuid, text, text, text, text, text, text[], boolean) to authenticated;
grant execute on function public.admin_delete_changelog_entry(uuid) to authenticated;

-- Refresh PostgREST schema cache
notify pgrst, 'reload schema';
