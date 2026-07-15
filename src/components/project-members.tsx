import { createClient } from "@/lib/supabase/server";
import { InviteGenerator } from "./invite-generator";
import type { UserRole } from "@/types/database";

const ROLE_LABEL: Record<UserRole, string> = {
  client: "クライアント",
  creator: "制作者",
  admin: "管理者",
};

interface MemberRow {
  role_in_project: UserRole;
  profiles: { name: string | null; email: string } | null;
}

export async function ProjectMembers({
  projectId,
  isOwner,
}: {
  projectId: string;
  isOwner: boolean;
}) {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("project_members")
    .select("role_in_project, profiles(name, email)")
    .eq("project_id", projectId)
    .returns<MemberRow[]>();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1 text-sm">
        {members?.length ? (
          members.map((member, i) => (
            <li key={i}>
              {member.profiles?.name ?? member.profiles?.email} (
              {ROLE_LABEL[member.role_in_project]})
            </li>
          ))
        ) : (
          <p className="text-zinc-500">まだメンバーはいません。</p>
        )}
      </ul>

      {isOwner && <InviteGenerator projectId={projectId} />}
    </div>
  );
}
