"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canTransitionStatus } from "@/lib/permissions";
import type { ProjectStatus, UserRole } from "@/types/database";

export interface ProjectFormState {
  error: string | null;
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "") || null;

  if (!title) {
    return { error: "タイトルを入力してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Generate the id ourselves and skip .select() on the insert: chaining
  // .select() makes Postgres re-check the new row against the SELECT policy
  // (can_access_project, a SECURITY DEFINER function) as part of RETURNING,
  // which raises "new row violates row-level security policy" because that
  // function's own query can't see the row created earlier in the same
  // statement. Not needing RETURNING sidesteps it entirely.
  const id = randomUUID();
  const { error } = await supabase
    .from("projects")
    .insert({ id, title, deadline, owner_id: user.id });

  if (error) {
    return { error: error.message };
  }

  redirect(`/projects/${id}`);
}

export async function updateProject(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const deadline = String(formData.get("deadline") ?? "") || null;

  if (!title) {
    return { error: "タイトルを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ title, deadline })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${id}`);
  return { error: null };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  redirect("/dashboard");
}

export async function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("project_members")
    .select("role_in_project")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle<{ role_in_project: UserRole }>();

  let role: UserRole;
  if (membership) {
    role = membership.role_in_project;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: UserRole }>();
    role = profile?.role ?? "client";
  }

  // The UI only ever offers transitions valid for the user's role, so
  // reaching here otherwise means the request was tampered with.
  if (!canTransitionStatus(role, newStatus)) {
    throw new Error("この操作を行う権限がありません。");
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}
