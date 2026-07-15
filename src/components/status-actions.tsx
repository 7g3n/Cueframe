import { updateProjectStatus } from "@/app/projects/actions";
import { availableStatusTransitions } from "@/lib/permissions";
import type { ProjectStatus, UserRole } from "@/types/database";

const STATUS_ACTION_LABEL: Record<ProjectStatus, string> = {
  pending: "確認待ちに戻す",
  in_revision: "修正中にする",
  approved: "承認する",
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
  const options = availableStatusTransitions(role, currentStatus);

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
