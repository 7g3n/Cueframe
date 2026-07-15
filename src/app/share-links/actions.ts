"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createShareLink(
  projectId: string,
  expiresInDays: number | null,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("ログインが必要です。");
  }

  const expires_at = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Generate the token ourselves and skip .select() on the insert — see
  // the comment in projects/actions.ts createProject for why chaining
  // .select() after insert breaks here.
  const token = randomBytes(16).toString("hex");
  const { error } = await supabase.from("share_links").insert({
    project_id: projectId,
    created_by: user.id,
    expires_at,
    token,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
  return token;
}

export async function deleteShareLink(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("share_links").delete().eq("id", id);
  revalidatePath(`/projects/${projectId}`);
}
