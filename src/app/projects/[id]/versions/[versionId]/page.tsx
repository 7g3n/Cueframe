import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_FILES_BUCKET } from "@/lib/storage";
import type { Comment, Version } from "@/types/database";
import { AudioReview } from "@/components/audio-review";

export default async function VersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: version } = await supabase
    .from("versions")
    .select("*")
    .eq("id", versionId)
    .single<Version>();

  if (!version) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("version_id", versionId)
    .order("timestamp_sec", { ascending: true, nullsFirst: false })
    .returns<Comment[]>();

  let audioUrl: string | null = null;
  if (version.file_type === "audio") {
    const { data: signed } = await supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .createSignedUrl(version.file_path, 3600);
    audioUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
      <Link
        href={`/projects/${id}`}
        className="text-sm text-zinc-500 underline"
      >
        ← プロジェクトに戻る
      </Link>

      <h1 className="mt-4 text-xl font-semibold">
        v{version.version_number}({version.file_type})
      </h1>

      <div className="mt-6">
        {audioUrl ? (
          <AudioReview
            versionId={versionId}
            audioUrl={audioUrl}
            comments={comments ?? []}
          />
        ) : (
          <p className="text-sm text-zinc-500">
            このファイル形式は現在、波形レビューに対応していません。
          </p>
        )}
      </div>
    </div>
  );
}
