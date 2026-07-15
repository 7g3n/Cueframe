-- Profiles table: one row per auth.users, carries the app-level role.
create type public.user_role as enum ('client', 'creator', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- security definer avoids RLS recursion when other policies check the caller's role.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- Phase 1 scope: any authenticated user may update their own row, including
-- role. Phase 5 tightens this so only admins can change `role`.
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth.users row is created.
-- role/name can be supplied via signUp's options.data (see src/app/(auth)/actions.ts).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
