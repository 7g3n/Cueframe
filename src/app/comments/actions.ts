"use server";

import { createClient } from "@/lib/supabase/server";

export interface CommentFormState {
  status: "idle" | "success";
  error: string | null;
}

export async function createComment(
  versionId: string,
  timestampSec: number | null,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { status: "idle", error: "コメントを入力してください。" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "idle", error: "ログインが必要です。" };
  }

  const { error } = await supabase.from("comments").insert({
    version_id: versionId,
    author_id: user.id,
    timestamp_sec: timestampSec,
    body,
  });

  if (error) {
    return { status: "idle", error: error.message };
  }

  return { status: "success", error: null };
}

export async function toggleResolved(commentId: string, resolved: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .update({ resolved })
    .eq("id", commentId);

  return { error: error?.message ?? null };
}
