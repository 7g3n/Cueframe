create type public.task_status as enum ('todo', 'in_progress', 'done');

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  assignee_id uuid references public.profiles (id) on delete set null,
  title text not null,
  due_date date,
  status public.task_status not null default 'todo',
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "tasks_select_member"
  on public.tasks for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id
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

create policy "tasks_insert_member"
  on public.tasks for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members
          where project_id = p.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "tasks_update_member"
  on public.tasks for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id
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

create policy "tasks_delete_member"
  on public.tasks for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = tasks.project_id
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
