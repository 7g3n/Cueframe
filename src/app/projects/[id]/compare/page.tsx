import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_FILES_BUCKET } from "@/lib/storage";
import type { Version } from "@/types/database";
import { ABPlayer } from "@/components/ab-player";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { id } = await params;
  const { a, b } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: versions } = await supabase
    .from("versions")
    .select("*")
    .eq("project_id", id)
    .eq("file_type", "audio")
    .order("version_number", { ascending: false })
    .returns<Version[]>();

  if (!versions || versions.length < 2) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <Link
          href={`/projects/${id}`}
          className="text-sm text-zinc-500 underline"
        >
          ← プロジェクトに戻る
        </Link>
        <p className="mt-8 text-sm text-zinc-500">
          A/B比較には音声バージョンが2つ以上必要です。
        </p>
      </div>
    );
  }

  const versionA = versions.find((v) => v.id === a) ?? versions[0];
  const versionB = versions.find((v) => v.id === b) ?? versions[1];

  const [{ data: signedA }, { data: signedB }] = await Promise.all([
    supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .createSignedUrl(versionA.file_path, 3600),
    supabase.storage
      .from(PROJECT_FILES_BUCKET)
      .createSignedUrl(versionB.file_path, 3600),
  ]);

  if (!signedA || !signedB) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <p className="text-sm text-red-600 dark:text-red-400">
          ファイルの読み込みに失敗しました。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
      <Link
        href={`/projects/${id}`}
        className="text-sm text-zinc-500 underline"
      >
        ← プロジェクトに戻る
      </Link>

      <h1 className="mt-4 text-xl font-semibold">A/B比較</h1>

      <form
        method="get"
        className="mt-6 flex flex-wrap items-end gap-4 text-sm"
      >
        <label className="flex flex-col gap-1">
          バージョンA
          <select
            name="a"
            defaultValue={versionA.id}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          バージョンB
          <select
            name="b"
            defaultValue={versionB.id}
            className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version_number}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-full border border-black/15 px-4 py-2 dark:border-white/20"
        >
          比較する
        </button>
      </form>

      <div className="mt-8">
        <ABPlayer
          labelA={`v${versionA.version_number}`}
          labelB={`v${versionB.version_number}`}
          urlA={signedA.signedUrl}
          urlB={signedB.signedUrl}
        />
      </div>
    </div>
  );
}
