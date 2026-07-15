-- project_files_select_own (0002) only matched the owner's own folder
-- prefix, so an invited member (e.g. a client reviewing a creator's
-- upload) could see a version's metadata but couldn't actually fetch or
-- sign a URL for the underlying file — reviewing someone else's work is
-- the whole point of membership, so this was a real gap.
--
-- Replaced with a version-based check using the same can_access_project()
-- helper as every other member-aware policy, which also covers the owner
-- case, making project_files_select_own redundant.
drop policy "project_files_select_own" on storage.objects;

create policy "project_files_select_member"
  on storage.objects for select
  using (
    bucket_id = 'project-files'
    and exists (
      select 1 from public.versions v
      where v.file_path = storage.objects.name
      and public.can_access_project(v.project_id)
    )
  );
