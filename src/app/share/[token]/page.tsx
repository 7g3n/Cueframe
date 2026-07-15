import { createClient } from "@/lib/supabase/server";
import { PROJECT_FILES_BUCKET } from "@/lib/storage";
import { StatusBadge } from "@/components/status-badge";
import type { Comment, ProjectStatus, Version } from "@/types/database";

interface SharedProject {
  id: string;
  title: string;
  status: ProjectStatus;
  deadline: string | null;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: projects } = await supabase.rpc("get_shared_project", {
    share_token: token,
  });
  const project = (projects as SharedProject[] | null)?.[0];

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-md flex-1 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">このリンクは無効です</h1>
        <p className="mt-2 text-sm text-zinc-500">
          リンクの有効期限が切れているか、取り消されています。
        </p>
      </div>
    );
  }

  const [{ data: versionsData }, { data: commentsData }] = await Promise.all([
    supabase.rpc("get_shared_versions", { share_token: token }),
    supabase.rpc("get_shared_comments", { share_token: token }),
  ]);

  const versions = (versionsData as Version[] | null) ?? [];
  const comments = (commentsData as Comment[] | null) ?? [];

  const signedUrls = await Promise.all(
    versions.map((v) =>
      supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .createSignedUrl(v.file_path, 3600),
    ),
  );

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.title}</h1>
        <StatusBadge status={project.status} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">閲覧専用の共有ビューです。</p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">バージョン</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {versions.length ? (
            versions.map((version, i) => (
              <li
                key={version.id}
                className="rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
              >
                <p className="text-sm">
                  v{version.version_number}({version.file_type})
                </p>
                {version.file_type === "audio" &&
                  signedUrls[i].data?.signedUrl && (
                    <audio
                      controls
                      src={signedUrls[i].data.signedUrl}
                      className="mt-2 w-full"
                    />
                  )}
              </li>
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              まだバージョンがありません。
            </p>
          )}
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">コメント</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {comments.length ? (
            comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/15"
              >
                <span className="font-mono text-xs text-zinc-500">
                  {comment.timestamp_sec !== null
                    ? formatTime(comment.timestamp_sec)
                    : "全体"}
                </span>
                <p className="mt-1">{comment.body}</p>
              </li>
            ))
          ) : (
            <p className="text-sm text-zinc-500">コメントはありません。</p>
          )}
        </ul>
      </div>
    </div>
  );
}
