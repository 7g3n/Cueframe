"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInvite } from "@/app/invites/actions";
import type { UserRole } from "@/types/database";

export function InviteGenerator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [role, setRole] = useState<Exclude<UserRole, "admin">>("client");
  const [link, setLink] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    try {
      const token = await createInvite(projectId, role);
      setLink(`${window.location.origin}/invites/${token}`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <select
          value={role}
          onChange={(e) =>
            setRole(e.target.value as Exclude<UserRole, "admin">)
          }
          className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 dark:border-white/20"
        >
          <option value="client">クライアントとして招待</option>
          <option value="creator">制作者として招待</option>
        </select>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isPending}
          className="rounded-full border border-black/15 px-4 py-1.5 disabled:opacity-60 dark:border-white/20"
        >
          {isPending ? "作成中..." : "招待リンクを発行"}
        </button>
      </div>

      {link && (
        <input
          type="text"
          readOnly
          value={link}
          aria-label="招待リンク"
          onFocus={(e) => e.target.select()}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      )}
    </div>
  );
}
