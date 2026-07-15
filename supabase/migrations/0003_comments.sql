-- Timestamped comments on a version. timestamp_sec is null for
-- whole-file/general comments (not tied to a point on the waveform).
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.versions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  timestamp_sec numeric,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

-- Phase 3 scope: owner-only access, mirroring versions/projects. Phase 5
-- extends this to shared project members.
create policy "comments_select_own"
  on public.comments for select
  using (
    exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "comments_insert_own"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id and p.owner_id = auth.uid()
    )
  );

create policy "comments_update_own"
  on public.comments for update
  using (
    exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id and p.owner_id = auth.uid()
    )
  );

create policy "comments_delete_own"
  on public.comments for delete
  using (
    exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id and p.owner_id = auth.uid()
    )
  );
