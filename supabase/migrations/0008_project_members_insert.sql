-- 0004 defined select/delete policies for project_members but never an
-- insert one, so with RLS enabled and no permissive policy, every insert
-- (i.e. every invite redemption) was denied by default.
--
-- Self-service joins are only allowed when a matching, unexpired invite for
-- that project+role exists — otherwise anyone who guessed a project's UUID
-- could grant themselves membership without ever holding an invite token.
create policy "project_members_insert_self_via_invite"
  on public.project_members for insert
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.project_invites
        where project_id = project_members.project_id
        and role_in_project = project_members.role_in_project
        and (expires_at is null or expires_at > now())
      )
    )
    or public.is_project_owner(project_id)
  );
