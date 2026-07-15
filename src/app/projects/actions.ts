"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectStatus, UserRole } from "@/types/database";

export interface ProjectFormState {
  error: string | null;
}

// Phase 4 scope: gated by the requester's global role. Phase 5's
// project_members table will let this vary per-project (e.g. an admin
// acting as a client on one project and creator on another).
const ALLOWED_STATUS_TRANSITIONS: Record<UserRole, ProjectStatus[]> = {
  client: ["approved"],
  creator: ["pending", "in_revision"],
  admin: ["pending", "in_revision", "approved"],
};

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

  const { data, error } = await supabase
    .from("projects")
    .insert({ title, deadline, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "プロジェクトの作成に失敗しました。" };
  }

  redirect(`/projects/${data.id}`);
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: UserRole }>();

  const role = profile?.role ?? "client";

  // The UI only ever offers transitions valid for the user's role, so
  // reaching here otherwise means the request was tampered with.
  if (!ALLOWED_STATUS_TRANSITIONS[role].includes(newStatus)) {
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
