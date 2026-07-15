"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACCEPTED_MIME_TYPES,
  PROJECT_FILES_BUCKET,
  buildStoragePath,
  detectFileType,
} from "@/lib/storage";

export function FileUpload({ projectId }: { projectId: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setError(null);

    const fileType = detectFileType(file.type);
    if (!fileType) {
      setError("対応していないファイル形式です(wav/mp3/mp4/jpg/png/pdf)。");
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setError("ログインが必要です。");
      return;
    }

    const path = buildStoragePath(session.user.id, projectId, file.name);

    setProgress(0);

    try {
      await uploadWithProgress({
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${PROJECT_FILES_BUCKET}/${path}`,
        accessToken: session.access_token,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        file,
        onProgress: setProgress,
      });

      const { error: insertError } = await supabase.from("versions").insert({
        project_id: projectId,
        file_path: path,
        file_type: fileType,
      });

      if (insertError) throw new Error(insertError.message);

      setProgress(null);
      router.refresh();
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : "アップロードに失敗しました。");
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
        isDragging
          ? "border-foreground bg-black/5 dark:bg-white/10"
          : "border-black/20 dark:border-white/25"
      }`}
    >
      <p>ファイルをドラッグ&ドロップ、または選択してください</p>
      <p className="text-xs text-zinc-500">wav / mp3 / mp4 / jpg / png / pdf</p>

      <label className="cursor-pointer rounded-full border border-black/15 px-4 py-2 dark:border-white/20">
        ファイルを選択
        <input
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>

      {progress !== null && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="アップロード進捗"
          className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        >
          <div
            className="h-full bg-foreground transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function uploadWithProgress({
  url,
  accessToken,
  anonKey,
  file,
  onProgress,
}: {
  url: string;
  accessToken: string;
  anonKey: string;
  file: File;
  onProgress: (percent: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`アップロードに失敗しました(${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("アップロードに失敗しました。"));

    xhr.send(file);
  });
}
