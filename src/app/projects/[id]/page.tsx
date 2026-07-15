import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Project, Task, UserRole, Version } from "@/types/database";
import { StatusBadge } from "@/components/status-badge";
import { StatusActions } from "@/components/status-actions";
import { FileUpload } from "@/components/file-upload";
import { ProjectEditForm } from "@/components/project-edit-form";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { ProjectMembers } from "@/components/project-members";
import { ShareLinksList } from "@/components/share-links-list";
import { TaskList } from "@/components/task-list";

interface MemberWithProfile {
  user_id: string;
  profiles: { name: string | null; email: string } | null;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single<Project>();

  if (!project) {
    notFound();
  }

  const isOwner = project.owner_id === user.id;

  const [
    { data: versions },
    { data: profile },
    { data: myMembership },
    { data: ownerProfile },
    { data: memberRows },
    { data: tasks },
  ] = await Promise.all([
    supabase
      .from("versions")
      .select("*")
      .eq("project_id", id)
      .order("version_number", { ascending: false })
      .returns<Version[]>(),
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    isOwner
      ? Promise.resolve({ data: null })
      : supabase
          .from("project_members")
          .select("role_in_project")
          .eq("project_id", id)
          .eq("user_id", user.id)
          .maybeSingle<{ role_in_project: UserRole }>(),
    supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", project.owner_id)
      .single<{ id: string; name: string | null; email: string }>(),
    supabase
      .from("project_members")
      .select("user_id, profiles(name, email)")
      .eq("project_id", id)
      .returns<MemberWithProfile[]>(),
    supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .returns<Task[]>(),
  ]);

  const audioVersionCount =
    versions?.filter((v) => v.file_type === "audio").length ?? 0;

  const effectiveRole: UserRole =
    myMembership?.role_in_project ?? profile?.role ?? "client";
  const canUpload = isOwner || effectiveRole === "creator";

  const assignees = [
    ...(ownerProfile
      ? [{ id: ownerProfile.id, label: ownerProfile.name ?? ownerProfile.email }]
      : []),
    ...(memberRows ?? []).map((m) => ({
      id: m.user_id,
      label: m.profiles?.name ?? m.profiles?.email ?? m.user_id,
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <Link href="/dashboard" className="text-sm text-zinc-500 underline">
        ← ダッシュボードに戻る
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <StatusBadge status={project.status} />
      </div>

      {project.deadline && (
        <p className="mt-1 text-sm text-zinc-500">締切: {project.deadline}</p>
      )}

      <div className="mt-4">
        <StatusActions
          projectId={project.id}
          currentStatus={project.status}
          role={effectiveRole}
        />
      </div>

      {isOwner && (
        <div className="mt-8">
          <ProjectEditForm project={project} />
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">バージョン</h2>
          {audioVersionCount >= 2 && (
            <Link
              href={`/projects/${project.id}/compare`}
              className="text-sm underline"
            >
              A/B比較
            </Link>
          )}
        </div>

        {canUpload && (
          <div className="mt-3">
            <FileUpload projectId={project.id} />
          </div>
        )}

        <ul className="mt-4 flex flex-col gap-2">
          {versions?.length ? (
            versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
              >
                <span>
                  v{version.version_number}({version.file_type})
                </span>
                <span className="flex items-center gap-4">
                  {version.file_type === "audio" && (
                    <Link
                      href={`/projects/${project.id}/versions/${version.id}`}
                      className="text-sm underline"
                    >
                      レビュー
                    </Link>
                  )}
                  <a
                    href={`/projects/${project.id}/versions/${version.id}/download`}
                    className="text-sm underline"
                  >
                    ダウンロード
                  </a>
                </span>
              </li>
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              まだバージョンがアップロードされていません。
            </p>
          )}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">タスク</h2>
        <div className="mt-3">
          <TaskList
            projectId={project.id}
            tasks={tasks ?? []}
            assignees={assignees}
          />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">メンバー</h2>
        <div className="mt-3">
          <ProjectMembers projectId={project.id} isOwner={isOwner} />
        </div>
      </div>

      {isOwner && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">共有リンク</h2>
          <p className="mt-1 text-xs text-zinc-500">
            ログイン不要で閲覧できる共有ビューを発行します。
          </p>
          <div className="mt-3">
            <ShareLinksList projectId={project.id} />
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-8">
          <DeleteProjectButton projectId={project.id} />
        </div>
      )}
    </div>
  );
}
