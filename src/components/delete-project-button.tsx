"use client";

import { deleteProject } from "@/app/projects/actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  return (
    <form
      action={deleteProject.bind(null, projectId)}
      onSubmit={(e) => {
        if (!confirm("このプロジェクトを削除しますか?元に戻せません。")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-red-600 underline dark:text-red-400"
      >
        プロジェクトを削除
      </button>
    </form>
  );
}
