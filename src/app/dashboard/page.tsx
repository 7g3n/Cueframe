import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, Project, Task } from "@/types/database";
import { ProjectCreateForm } from "@/components/project-create-form";
import { StatusBadge } from "@/components/status-badge";

interface TaskWithProject extends Task {
  projects: { title: string } | null;
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="text-2xl font-semibold">ダッシュボード</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Supabaseが未設定のため、この機能はまだ利用できません。
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: projects }, { data: myTasks }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>(),
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<Project[]>(),
      supabase
        .from("tasks")
        .select("*, projects(title)")
        .eq("assignee_id", user.id)
        .neq("status", "done")
        .not("due_date", "is", null)
        .order("due_date", { ascending: true })
        .returns<TaskWithProject[]>(),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const dueSoonThreshold = addDays(today, 3);
  const upcomingTasks = (myTasks ?? []).filter(
    (task) => task.due_date !== null && task.due_date <= dueSoonThreshold,
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold">ダッシュボード</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        ようこそ、{profile?.name ?? user.email} さん
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        ロール: {profile?.role ?? "unknown"}
      </p>

      {upcomingTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">締切間近のタスク</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {upcomingTasks.map((task) => {
              const isOverdue = task.due_date! < today;
              return (
                <li key={task.id}>
                  <Link
                    href={`/projects/${task.project_id}`}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5 ${
                      isOverdue
                        ? "border-red-400 bg-red-50 dark:bg-red-950"
                        : "border-amber-400 bg-amber-50 dark:bg-amber-950"
                    }`}
                  >
                    <span>
                      {task.title}
                      <span className="ml-2 text-xs text-zinc-500">
                        ({task.projects?.title})
                      </span>
                    </span>
                    <span className="text-xs">{task.due_date}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <ProjectCreateForm />
      </div>

      <ul className="mt-8 flex flex-col gap-2">
        {projects?.length ? (
          projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <span>{project.title}</span>
                <StatusBadge status={project.status} />
              </Link>
            </li>
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            プロジェクトはまだありません。上のフォームから作成してください。
          </p>
        )}
      </ul>
    </div>
  );
}
