import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Project, Version } from "@/types/database";
import { StatusBadge } from "@/components/status-badge";
import { FileUpload } from "@/components/file-upload";
import { ProjectEditForm } from "@/components/project-edit-form";
import { DeleteProjectButton } from "@/components/delete-project-button";

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

  const { data: versions } = await supabase
    .from("versions")
    .select("*")
    .eq("project_id", id)
    .order("version_number", { ascending: false })
    .returns<Version[]>();

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

      <div className="mt-8">
        <ProjectEditForm project={project} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">バージョン</h2>
        <div className="mt-3">
          <FileUpload projectId={project.id} />
        </div>

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
                <a
                  href={`/projects/${project.id}/versions/${version.id}/download`}
                  className="text-sm underline"
                >
                  開く
                </a>
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
        <DeleteProjectButton projectId={project.id} />
      </div>
    </div>
  );
}
