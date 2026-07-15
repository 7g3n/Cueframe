"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

interface ABPlayerProps {
  labelA: string;
  labelB: string;
  urlA: string;
  urlB: string;
}

export function ABPlayer({ labelA, labelB, urlA, urlB }: ABPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  const [active, setActive] = useState<"A" | "B">("A");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Recreated only when the underlying files change (a new A/B pair is
  // picked); switching between the already-loaded A/B pair uses switchTo
  // below so playback position/state can be preserved across the swap.
  useEffect(() => {
    if (!containerRef.current) return;

    setActive("A");

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#a1a1aa",
      progressColor: "#52525b",
      cursorColor: "#ef4444",
      height: 96,
      url: urlA,
    });

    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("finish", () => setIsPlaying(false));

    wsRef.current = ws;

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [urlA, urlB]);

  async function switchTo(target: "A" | "B") {
    const ws = wsRef.current;
    if (!ws || target === active || isSwitching) return;

    setIsSwitching(true);
    const time = ws.getCurrentTime();
    const wasPlaying = ws.isPlaying();

    try {
      await ws.load(target === "A" ? urlA : urlB);
      ws.setTime(time);
      if (wasPlaying) await ws.play();
      setActive(target);
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={containerRef} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => wsRef.current?.playPause()}
          className="rounded-full border border-black/15 px-4 py-1.5 text-sm dark:border-white/20"
        >
          {isPlaying ? "一時停止" : "再生"}
        </button>

        <div
          role="group"
          aria-label="A/B切り替え"
          className="flex overflow-hidden rounded-full border border-black/15 text-sm dark:border-white/20"
        >
          <button
            type="button"
            onClick={() => switchTo("A")}
            disabled={isSwitching}
            aria-pressed={active === "A"}
            className={`px-4 py-1.5 disabled:opacity-60 ${
              active === "A" ? "bg-foreground text-background" : ""
            }`}
          >
            A: {labelA}
          </button>
          <button
            type="button"
            onClick={() => switchTo("B")}
            disabled={isSwitching}
            aria-pressed={active === "B"}
            className={`px-4 py-1.5 disabled:opacity-60 ${
              active === "B" ? "bg-foreground text-background" : ""
            }`}
          >
            B: {labelB}
          </button>
        </div>
      </div>
    </div>
  );
}
