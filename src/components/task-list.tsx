"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createTask,
  deleteTask,
  updateTaskStatus,
  type TaskFormState,
} from "@/app/tasks/actions";
import type { Task, TaskStatus } from "@/types/database";

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  done: "完了",
};

interface AssigneeOption {
  id: string;
  label: string;
}

const initialState: TaskFormState = { error: null };

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function TaskList({
  projectId,
  tasks,
  assignees,
}: {
  projectId: string;
  tasks: Task[];
  assignees: AssigneeOption[];
}) {
  const router = useRouter();
  const action = createTask.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const today = new Date().toISOString().slice(0, 10);
  const dueSoonThreshold = addDays(today, 3);

  return (
    <div className="flex flex-col gap-3">
      <form
        action={formAction}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          タスク名
          <input
            type="text"
            name="title"
            required
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          担当者
          <select
            name="assignee_id"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          >
            <option value="">未割り当て</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          期限
          <input
            type="date"
            name="due_date"
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-black/15 px-4 py-2 disabled:opacity-60 dark:border-white/20"
        >
          {pending ? "追加中..." : "タスクを追加"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {tasks.length ? (
          tasks.map((task) => {
            const isOverdue =
              task.due_date !== null &&
              task.due_date < today &&
              task.status !== "done";
            const isDueSoon =
              task.due_date !== null &&
              !isOverdue &&
              task.status !== "done" &&
              task.due_date <= dueSoonThreshold;

            return (
              <li
                key={task.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm ${
                  isOverdue
                    ? "border-red-400 bg-red-50 dark:bg-red-950"
                    : isDueSoon
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950"
                      : "border-black/10 dark:border-white/15"
                }`}
              >
                <div>
                  <p>{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-zinc-500">
                      期限: {task.due_date}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={task.status}
                    onChange={(e) => {
                      void updateTaskStatus(
                        task.id,
                        projectId,
                        e.target.value as TaskStatus,
                      ).then(() => router.refresh());
                    }}
                    className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs dark:border-white/20"
                  >
                    {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteTask(task.id, projectId).then(() =>
                        router.refresh(),
                      );
                    }}
                    className="text-xs text-red-600 underline dark:text-red-400"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })
        ) : (
          <p className="text-sm text-zinc-500">タスクはまだありません。</p>
        )}
      </ul>
    </div>
  );
}
