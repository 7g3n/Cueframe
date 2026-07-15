"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShareLink } from "@/app/share-links/actions";

const EXPIRY_OPTIONS = [
  { label: "7日", value: "7" },
  { label: "1日", value: "1" },
  { label: "30日", value: "30" },
  { label: "無期限", value: "" },
];

export function ShareLinkGenerator({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [expiry, setExpiry] = useState("7");
  const [link, setLink] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleGenerate() {
    setIsPending(true);
    try {
      const days = expiry ? Number(expiry) : null;
      const token = await createShareLink(projectId, days);
      setLink(`${window.location.origin}/share/${token}`);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="rounded-md border border-black/15 bg-transparent px-2 py-1.5 dark:border-white/20"
        >
          {EXPIRY_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isPending}
          className="rounded-full border border-black/15 px-4 py-1.5 disabled:opacity-60 dark:border-white/20"
        >
          {isPending ? "作成中..." : "共有リンクを発行"}
        </button>
      </div>

      {link && (
        <input
          type="text"
          readOnly
          value={link}
          aria-label="共有リンク"
          onFocus={(e) => e.target.select()}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
        />
      )}
    </div>
  );
}
