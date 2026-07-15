import { createClient } from "@/lib/supabase/server";
import { redeemInvite } from "../actions";
import type { Project, ProjectInvite, UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  client: "クライアント(依頼主)",
  creator: "制作者",
  admin: "管理者",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("project_invites")
    .select("*")
    .eq("token", token)
    .single<ProjectInvite>();

  if (!invite) {
    return (
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">招待リンクが無効です</h1>
        <p className="mt-2 text-sm text-zinc-500">
          リンクが期限切れか、取り消されています。
        </p>
      </div>
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", invite.project_id)
    .single<Project>();

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">プロジェクトへの招待</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        「{project?.title ?? "プロジェクト"}」に
        <br />
        <strong>{ROLE_LABEL[invite.role_in_project]}</strong>
        として参加しますか?
      </p>

      <form action={redeemInvite.bind(null, token)} className="mt-6">
        <button
          type="submit"
          className="rounded-full bg-foreground px-6 py-2 text-background"
        >
          参加する
        </button>
      </form>
    </div>
  );
}
