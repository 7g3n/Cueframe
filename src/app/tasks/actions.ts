"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/types/database";

export interface TaskFormState {
  error: string | null;
}

export async function createTask(
  projectId: string,
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "") || null;
  const assigneeId = String(formData.get("assignee_id") ?? "") || null;

  if (!title) {
    return { error: "タスク名を入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    due_date: dueDate,
    assignee_id: assigneeId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null };
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus,
) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath(`/projects/${projectId}`);
}
