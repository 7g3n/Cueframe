-- Fixes "infinite recursion detected in policy for relation projects":
-- projects_select_member queried project_members, whose own select policy
-- queried projects back — RLS re-evaluates on every access regardless of
-- subquery depth, so that pair cycled forever. These SECURITY DEFINER
-- helpers (same bypass trick as is_admin() in 0001) do the membership
-- check without going back through the other table's RLS.

create or replace function public.is_project_owner(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.projects where id = pid and owner_id = auth.uid()
  );
$$;

create or replace function public.project_member_role(pid uuid)
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role_in_project from public.project_members
  where project_id = pid and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_project_member(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.project_member_role(pid) is not null;
$$;

create or replace function public.can_access_project(pid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_project_owner(pid)
    or public.is_project_member(pid)
    or public.is_admin();
$$;

-- projects
drop policy "projects_select_member" on public.projects;
create policy "projects_select_member"
  on public.projects for select
  using (public.can_access_project(id));

drop policy "projects_update_member" on public.projects;
create policy "projects_update_member"
  on public.projects for update
  using (public.can_access_project(id));

-- project_members
drop policy "project_members_select" on public.project_members;
create policy "project_members_select"
  on public.project_members for select
  using (
    user_id = auth.uid()
    or public.is_project_owner(project_id)
    or public.is_admin()
  );

drop policy "project_members_delete_owner" on public.project_members;
create policy "project_members_delete_owner"
  on public.project_members for delete
  using (public.is_project_owner(project_id) or public.is_admin());

-- project_invites
drop policy "project_invites_select_own_project" on public.project_invites;
create policy "project_invites_select_own_project"
  on public.project_invites for select
  using (public.is_project_owner(project_id) or public.is_admin());

drop policy "project_invites_insert_own_project" on public.project_invites;
create policy "project_invites_insert_own_project"
  on public.project_invites for insert
  with check (created_by = auth.uid() and public.is_project_owner(project_id));

drop policy "project_invites_delete_own_project" on public.project_invites;
create policy "project_invites_delete_own_project"
  on public.project_invites for delete
  using (public.is_project_owner(project_id) or public.is_admin());

-- versions
drop policy "versions_select_member" on public.versions;
create policy "versions_select_member"
  on public.versions for select
  using (public.can_access_project(project_id));

drop policy "versions_insert_creator" on public.versions;
create policy "versions_insert_creator"
  on public.versions for insert
  with check (
    public.is_project_owner(project_id)
    or public.project_member_role(project_id) = 'creator'
  );

drop policy "versions_delete_own" on public.versions;
create policy "versions_delete_own"
  on public.versions for delete
  using (public.is_project_owner(project_id));

-- comments
drop policy "comments_select_member" on public.comments;
create policy "comments_select_member"
  on public.comments for select
  using (
    exists (
      select 1 from public.versions v
      where v.id = comments.version_id
      and public.can_access_project(v.project_id)
    )
  );

drop policy "comments_insert_member" on public.comments;
create policy "comments_insert_member"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.versions v
      where v.id = comments.version_id
      and public.can_access_project(v.project_id)
    )
  );

drop policy "comments_delete_own_or_owner" on public.comments;
create policy "comments_delete_own_or_owner"
  on public.comments for delete
  using (
    author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.versions v
      where v.id = comments.version_id and public.is_project_owner(v.project_id)
    )
  );

-- tasks
drop policy "tasks_select_member" on public.tasks;
create policy "tasks_select_member"
  on public.tasks for select
  using (public.can_access_project(project_id));

drop policy "tasks_insert_member" on public.tasks;
create policy "tasks_insert_member"
  on public.tasks for insert
  with check (public.can_access_project(project_id));

drop policy "tasks_update_member" on public.tasks;
create policy "tasks_update_member"
  on public.tasks for update
  using (public.can_access_project(project_id));

drop policy "tasks_delete_member" on public.tasks;
create policy "tasks_delete_member"
  on public.tasks for delete
  using (public.can_access_project(project_id));

-- share_links
drop policy "share_links_select_member" on public.share_links;
create policy "share_links_select_member"
  on public.share_links for select
  using (public.can_access_project(project_id));

drop policy "share_links_insert_owner" on public.share_links;
create policy "share_links_insert_owner"
  on public.share_links for insert
  with check (created_by = auth.uid() and public.is_project_owner(project_id));

drop policy "share_links_delete_owner" on public.share_links;
create policy "share_links_delete_owner"
  on public.share_links for delete
  using (public.is_project_owner(project_id) or public.is_admin());
