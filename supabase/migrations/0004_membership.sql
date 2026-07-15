-- Project membership: lets a project be shared with client/creator users
-- beyond just its owner_id. Extends the owner-only RLS from Phases 2-3 to
-- also recognize members.
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_in_project public.user_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.project_members enable row level security;

create policy "project_members_select"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects
      where id = project_members.project_id and owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "project_members_delete_owner"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.projects
      where id = project_members.project_id and owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Invite links: owner/creator generates one, any signed-in user who opens
-- it can redeem it to join as a member with the preset role.
create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role_in_project public.user_role not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.project_invites enable row level security;

create policy "project_invites_select_own_project"
  on public.project_invites for select
  using (
    exists (
      select 1 from public.projects
      where id = project_invites.project_id and owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "project_invites_insert_own_project"
  on public.project_invites for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.projects
      where id = project_invites.project_id and owner_id = auth.uid()
    )
  );

create policy "project_invites_delete_own_project"
  on public.project_invites for delete
  using (
    exists (
      select 1 from public.projects
      where id = project_invites.project_id and owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Any authenticated user may look up an invite by token (needed to show the
-- "join as ..." confirmation before they're a member) as long as it hasn't
-- expired.
create policy "project_invites_select_by_token"
  on public.project_invites for select
  using (expires_at is null or expires_at > now());

-- --- Extend projects/versions/comments RLS to recognize members ---

drop policy "projects_select_own" on public.projects;
create policy "projects_select_member"
  on public.projects for select
  using (
    auth.uid() = owner_id
    or public.is_admin()
    or exists (
      select 1 from public.project_members
      where project_id = projects.id and user_id = auth.uid()
    )
  );

-- Status transitions are gated in the app layer (see updateProjectStatus);
-- RLS just needs to admit members so that check ever runs.
drop policy "projects_update_own" on public.projects;
create policy "projects_update_member"
  on public.projects for update
  using (
    auth.uid() = owner_id
    or public.is_admin()
    or exists (
      select 1 from public.project_members
      where project_id = projects.id and user_id = auth.uid()
    )
  );

drop policy "versions_select_own" on public.versions;
create policy "versions_select_member"
  on public.versions for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = versions.project_id
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

-- Uploading is a creator action: the project owner, or a member whose
-- role_in_project is 'creator'.
drop policy "versions_insert_own" on public.versions;
create policy "versions_insert_creator"
  on public.versions for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = versions.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members
          where project_id = p.id
          and user_id = auth.uid()
          and role_in_project = 'creator'
        )
      )
    )
  );

drop policy "comments_select_own" on public.comments;
create policy "comments_select_member"
  on public.comments for select
  using (
    exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id
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

-- Any member (client or creator) can comment, not just the owner.
drop policy "comments_insert_own" on public.comments;
create policy "comments_insert_member"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members
          where project_id = p.id and user_id = auth.uid()
        )
      )
    )
  );

-- Anyone can delete their own comment; the project owner/admin can moderate.
drop policy "comments_delete_own" on public.comments;
create policy "comments_delete_own_or_owner"
  on public.comments for delete
  using (
    author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.versions v
      join public.projects p on p.id = v.project_id
      where v.id = comments.version_id and p.owner_id = auth.uid()
    )
  );
