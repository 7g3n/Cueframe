import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, Project } from "@/types/database";
import { ProjectCreateForm } from "@/components/project-create-form";
import { StatusBadge } from "@/components/status-badge";

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

  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Project[]>(),
  ]);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <h1 className="text-2xl font-semibold">ダッシュボード</h1>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">
        ようこそ、{profile?.name ?? user.email} さん
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        ロール: {profile?.role ?? "unknown"}
      </p>

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
