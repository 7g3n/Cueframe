"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
