"use client";

import { useActionState } from "react";
import { updateProject, type ProjectFormState } from "@/app/projects/actions";
import type { Project } from "@/types/database";

const initialState: ProjectFormState = { error: null };

export function ProjectEditForm({ project }: { project: Project }) {
  const [state, formAction, pending] = useActionState(
    updateProject,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="id" value={project.id} />

      <label className="flex flex-1 flex-col gap-1 text-sm">
        プロジェクト名
        <input
          type="text"
          name="title"
          required
          defaultValue={project.title}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        締切
        <input
          type="date"
          name="deadline"
          defaultValue={project.deadline ?? ""}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-black/15 px-5 py-2 disabled:opacity-60 dark:border-white/20"
      >
        {pending ? "更新中..." : "更新"}
      </button>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
