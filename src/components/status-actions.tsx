import { updateProjectStatus } from "@/app/projects/actions";
import type { ProjectStatus, UserRole } from "@/types/database";

const STATUS_ACTION_LABEL: Record<ProjectStatus, string> = {
  pending: "確認待ちに戻す",
  in_revision: "修正中にする",
  approved: "承認する",
};

const ALLOWED_TRANSITIONS: Record<UserRole, ProjectStatus[]> = {
  client: ["approved"],
  creator: ["pending", "in_revision"],
  admin: ["pending", "in_revision", "approved"],
};

export function StatusActions({
  projectId,
  currentStatus,
  role,
}: {
  projectId: string;
  currentStatus: ProjectStatus;
  role: UserRole;
}) {
  const options = ALLOWED_TRANSITIONS[role].filter(
    (status) => status !== currentStatus,
  );

  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => (
        <form
          key={status}
          action={updateProjectStatus.bind(null, projectId, status)}
        >
          <button
            type="submit"
            className="rounded-full border border-black/15 px-4 py-1.5 text-sm dark:border-white/20"
          >
            {STATUS_ACTION_LABEL[status]}
          </button>
        </form>
      ))}
    </div>
  );
}
