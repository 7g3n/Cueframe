"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-xl font-semibold">エラーが発生しました</h1>
          <p className="text-sm text-zinc-500">
            時間をおいてもう一度お試しください。
          </p>
        </div>
      </body>
    </html>
  );
}
