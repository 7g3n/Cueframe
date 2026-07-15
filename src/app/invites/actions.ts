"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export async function createInvite(
  projectId: string,
  roleInProject: UserRole,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Generate the token ourselves and skip .select() on the insert — see
  // the comment in projects/actions.ts createProject for why chaining
  // .select() after insert breaks here.
  const token = randomBytes(16).toString("hex");
  const { error } = await supabase.from("project_invites").insert({
    project_id: projectId,
    role_in_project: roleInProject,
    created_by: user.id,
    token,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
  return token;
}

export async function deleteInvite(inviteId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("project_invites").delete().eq("id", inviteId);
  revalidatePath(`/projects/${projectId}`);
}

export async function redeemInvite(token: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/invites/${token}`)}`);
  }

  const { data: invite } = await supabase
    .from("project_invites")
    .select("*")
    .eq("token", token)
    .single();

  if (!invite) {
    throw new Error("招待リンクが無効です。");
  }

  const { error } = await supabase.from("project_members").insert({
    project_id: invite.project_id,
    user_id: user.id,
    role_in_project: invite.role_in_project,
  });

  // 23505 = unique_violation: already a member, treat joining again as a no-op.
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  redirect(`/projects/${invite.project_id}`);
}
