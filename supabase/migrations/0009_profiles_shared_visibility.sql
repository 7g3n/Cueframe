-- profiles RLS (0001) only let a user see their own row or, if admin,
-- everyone's. Once projects can have multiple members (0004), that's too
-- strict: a client couldn't see the owner's/other members' name in the
-- assignee dropdown or members list. Extend it to co-members of any shared
-- project.
create or replace function public.shares_project_with(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.projects p
    where (p.owner_id = auth.uid() or public.is_project_member(p.id))
    and (
      p.owner_id = other_user_id
      or exists (
        select 1 from public.project_members pm
        where pm.project_id = p.id and pm.user_id = other_user_id
      )
    )
  );
$$;

create policy "profiles_select_shared_project"
  on public.profiles for select
  using (public.shares_project_with(id));
