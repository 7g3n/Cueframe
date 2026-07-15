-- Share links: token-based, no-login guest view with an optional expiry.
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

-- Managing links (creating/listing/revoking) requires being signed in as a
-- member of the project; the anonymous guest path never queries this table
-- directly (it goes through the SECURITY DEFINER functions below instead).
create policy "share_links_select_member"
  on public.share_links for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = share_links.project_id
      and (
        p.owner_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1 from public.project_members
          where project_id = p.id and user_id = auth.uid()
        )
      )
    )
  );

-- Owner-only, like project_invites: sharing outside the project is a
-- bigger step than commenting/uploading, so it isn't extended to members.
create policy "share_links_insert_owner"
  on public.share_links for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.projects p
      where p.id = share_links.project_id and p.owner_id = auth.uid()
    )
  );

create policy "share_links_delete_owner"
  on public.share_links for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = share_links.project_id and p.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- --- Anonymous guest read access, via SECURITY DEFINER RPCs ---
-- These deliberately bypass RLS (that's the point: a guest has no auth.uid())
-- but only ever expose data reachable from a valid, unexpired token.

create or replace function public.get_shared_project(share_token text)
returns table (
  id uuid,
  title text,
  status public.project_status,
  deadline date
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.title, p.status, p.deadline
  from public.share_links sl
  join public.projects p on p.id = sl.project_id
  where sl.token = share_token
  and (sl.expires_at is null or sl.expires_at > now());
$$;

create or replace function public.get_shared_versions(share_token text)
returns setof public.versions
language sql
security definer
set search_path = public
stable
as $$
  select v.*
  from public.share_links sl
  join public.versions v on v.project_id = sl.project_id
  where sl.token = share_token
  and (sl.expires_at is null or sl.expires_at > now())
  order by v.version_number desc;
$$;

create or replace function public.get_shared_comments(share_token text)
returns setof public.comments
language sql
security definer
set search_path = public
stable
as $$
  select c.*
  from public.share_links sl
  join public.versions v on v.project_id = sl.project_id
  join public.comments c on c.version_id = v.id
  where sl.token = share_token
  and (sl.expires_at is null or sl.expires_at > now())
  order by c.timestamp_sec asc nulls last;
$$;

grant execute on function public.get_shared_project(text) to anon, authenticated;
grant execute on function public.get_shared_versions(text) to anon, authenticated;
grant execute on function public.get_shared_comments(text) to anon, authenticated;

-- Storage objects are readable (and thus signable) with no auth at all when
-- their project has an active share link. Guests only ever learn a path via
-- get_shared_versions above, so this doesn't expose anything beyond that.
create policy "project_files_select_shared"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1
      from public.share_links sl
      join public.versions v on v.project_id = sl.project_id
      where v.file_path = storage.objects.name
      and (sl.expires_at is null or sl.expires_at > now())
    )
  );
