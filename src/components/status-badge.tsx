import type { ProjectStatus } from "@/types/database";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: "確認待ち",
  in_revision: "修正中",
  approved: "承認済み",
};

const STATUS_CLASS: Record<ProjectStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  in_revision: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  approved:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
