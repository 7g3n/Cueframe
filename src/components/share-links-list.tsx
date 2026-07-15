import { createClient } from "@/lib/supabase/server";
import { deleteShareLink } from "@/app/share-links/actions";
import { ShareLinkGenerator } from "./share-link-generator";
import type { ShareLink } from "@/types/database";

export async function ShareLinksList({ projectId }: { projectId: string }) {
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("share_links")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .returns<ShareLink[]>();

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2 text-sm">
        {links?.length ? (
          links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
            >
              <span className="truncate">
                /share/{link.token}
                {link.expires_at &&
                  ` (期限: ${new Date(link.expires_at).toLocaleDateString("ja-JP")})`}
              </span>
              <form action={deleteShareLink.bind(null, link.id, projectId)}>
                <button
                  type="submit"
                  className="shrink-0 text-xs text-red-600 underline dark:text-red-400"
                >
                  取り消す
                </button>
              </form>
            </li>
          ))
        ) : (
          <p className="text-zinc-500">共有リンクはまだありません。</p>
        )}
      </ul>

      <ShareLinkGenerator projectId={projectId} />
    </div>
  );
}
