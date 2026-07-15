-- Projects + versions, and the storage bucket versions' files live in.
create extension if not exists pgcrypto;

create type public.project_status as enum ('pending', 'in_revision', 'approved');
create type public.file_type as enum ('audio', 'video', 'image', 'pdf');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status public.project_status not null default 'pending',
  deadline date,
  created_at timestamptz not null default now()
);

create table public.versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  version_number integer not null,
  file_path text not null,
  file_type public.file_type not null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

-- version_number is assigned server-side (next per project) so callers don't
-- need to read-then-write it themselves; a concurrent race just fails the
-- unique constraint below rather than silently duplicating a number.
create function public.set_next_version_number()
returns trigger
language plpgsql
as $$
begin
  if new.version_number is null then
    select coalesce(max(version_number), 0) + 1 into new.version_number
    from public.versions
    where project_id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger set_version_number
  before insert on public.versions
  for each row execute procedure public.set_next_version_number();

alter table public.projects enable row level security;
alter table public.versions enable row level security;

-- Phase 2 scope: owner-only access. Phase 5 adds project_members-based sharing.
create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = owner_id or public.is_admin());

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = owner_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = owner_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = owner_id);

create policy "versions_select_own"
  on public.versions for select
  using (
    exists (
      select 1 from public.projects
      where id = versions.project_id and (owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "versions_insert_own"
  on public.versions for insert
  with check (
    exists (
      select 1 from public.projects
      where id = versions.project_id and owner_id = auth.uid()
    )
  );

create policy "versions_delete_own"
  on public.versions for delete
  using (
    exists (
      select 1 from public.projects
      where id = versions.project_id and owner_id = auth.uid()
    )
  );

-- Storage: one private bucket, objects keyed by "{owner_id}/{project_id}/...".
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "project_files_select_own"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_files_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project_files_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
