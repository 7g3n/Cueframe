"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin, { type Region } from "wavesurfer.js/plugins/regions";
import {
  createComment,
  toggleResolved,
  type CommentFormState,
} from "@/app/comments/actions";
import { filterUnresolved } from "@/lib/comments";
import type { Comment } from "@/types/database";

const MARKER_COLOR = "rgba(244, 63, 94, 0.5)";
const MARKER_COLOR_ACTIVE = "rgba(59, 130, 246, 0.7)";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioReviewProps {
  versionId: string;
  audioUrl: string;
  comments: Comment[];
}

export function AudioReview({ versionId, audioUrl, comments }: AudioReviewProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsRef = useRef<RegionsPlugin | null>(null);
  const regionMapRef = useRef<Map<string, Region>>(new Map());

  const [pendingTime, setPendingTime] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);

  const visibleComments = filterUnresolved(comments, showUnresolvedOnly);

  // Create the waveform once per audio URL.
  useEffect(() => {
    if (!containerRef.current) return;

    setIsReady(false);

    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a1a1aa",
      progressColor: "#52525b",
      cursorColor: "#ef4444",
      height: 96,
      url: audioUrl,
      plugins: [regions],
    });

    ws.on("interaction", (newTime) => setPendingTime(newTime));
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));
    // Region positions are a % of duration, so markers can't be placed
    // correctly until wavesurfer has decoded the file and knows it.
    ws.on("ready", () => setIsReady(true));

    wsRef.current = ws;
    regionsRef.current = regions;
    const regionMap = regionMapRef.current;

    return () => {
      ws.destroy();
      wsRef.current = null;
      regionsRef.current = null;
      regionMap.clear();
    };
  }, [audioUrl]);

  // Rebuild markers when the comment list changes (not on hover, so hovering
  // doesn't tear down and recreate every region).
  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions || !isReady) return;

    regions.clearRegions();
    regionMapRef.current.clear();

    visibleComments.forEach((comment) => {
      if (comment.timestamp_sec === null) return;

      const region = regions.addRegion({
        id: comment.id,
        start: comment.timestamp_sec,
        drag: false,
        resize: false,
        color: MARKER_COLOR,
      });

      region.on("click", (e) => {
        e.stopPropagation();
        wsRef.current?.setTime(comment.timestamp_sec!);
      });
      region.on("over", () => setHoveredId(comment.id));
      region.on("leave", () =>
        setHoveredId((current) => (current === comment.id ? null : current)),
      );

      regionMapRef.current.set(comment.id, region);
    });
  }, [visibleComments, isReady]);

  // Recolor the hovered marker without recreating any regions.
  useEffect(() => {
    regionMapRef.current.forEach((region, id) => {
      region.setOptions({
        color: hoveredId === id ? MARKER_COLOR_ACTIVE : MARKER_COLOR,
      });
    });
  }, [hoveredId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div ref={containerRef} data-testid="waveform" />
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => wsRef.current?.playPause()}
            className="rounded-full border border-black/15 px-4 py-1.5 text-sm dark:border-white/20"
          >
            {isPlaying ? "一時停止" : "再生"}
          </button>
          {pendingTime !== null && (
            <span className="text-sm text-zinc-500">
              {formatTime(pendingTime)} にコメントを追加します
            </span>
          )}
        </div>
      </div>

      {pendingTime !== null && (
        <CommentComposer
          versionId={versionId}
          timestampSec={pendingTime}
          onDone={() => setPendingTime(null)}
        />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={showUnresolvedOnly}
          onChange={(e) => setShowUnresolvedOnly(e.target.checked)}
        />
        未解決のみ表示
      </label>

      <ul className="flex flex-col gap-2">
        {visibleComments.length ? (
          visibleComments.map((comment) => (
            <li
              key={comment.id}
              onMouseEnter={() => setHoveredId(comment.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                comment.resolved ? "opacity-60" : ""
              } ${
                hoveredId === comment.id
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-950"
                  : "border-black/10 dark:border-white/15"
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (comment.timestamp_sec !== null) {
                      wsRef.current?.setTime(comment.timestamp_sec);
                    }
                  }}
                  onFocus={() => setHoveredId(comment.id)}
                  onBlur={() => setHoveredId(null)}
                  className="font-mono text-xs text-zinc-500 hover:underline"
                  aria-label={`${
                    comment.timestamp_sec !== null
                      ? formatTime(comment.timestamp_sec)
                      : "全体"
                  }の位置に再生をシーク`}
                >
                  {comment.timestamp_sec !== null
                    ? formatTime(comment.timestamp_sec)
                    : "全体"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void toggleResolved(comment.id, !comment.resolved).then(
                      () => router.refresh(),
                    );
                  }}
                  className="text-xs underline"
                >
                  {comment.resolved ? "未解決に戻す" : "解決済みにする"}
                </button>
              </div>
              <p className={`mt-1 ${comment.resolved ? "line-through" : ""}`}>
                {comment.body}
              </p>
            </li>
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            {showUnresolvedOnly
              ? "未解決のコメントはありません。"
              : "まだコメントはありません。"}
          </p>
        )}
      </ul>
    </div>
  );
}

const initialCommentFormState: CommentFormState = { status: "idle", error: null };

function CommentComposer({
  versionId,
  timestampSec,
  onDone,
}: {
  versionId: string;
  timestampSec: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const action = createComment.bind(null, versionId, timestampSec);
  const [state, formAction, pending] = useActionState(
    action,
    initialCommentFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      onDone();
    }
    // onDone/router are stable across renders; only re-run when the action result changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/15"
    >
      <label className="flex flex-col gap-1 text-sm">
        {formatTime(timestampSec)} へのコメント
        <textarea
          name="body"
          required
          rows={2}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-foreground px-4 py-1.5 text-sm text-background disabled:opacity-60"
        >
          {pending ? "投稿中..." : "コメントを投稿"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-zinc-500 underline"
        >
          キャンセル
        </button>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
