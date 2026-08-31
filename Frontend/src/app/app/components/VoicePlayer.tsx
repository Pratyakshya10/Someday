"use client";
// A voice-note pill: a round play/pause control, a waveform, and a running
// time — matching the reference. Plays the attachment's signed URL inline.

import { useEffect, useRef, useState } from "react";

const BARS = [0.4, 0.7, 0.5, 1, 0.65, 0.45, 0.85, 0.6, 0.35, 0.75, 0.5, 0.9, 0.55, 0.7, 0.4, 0.8, 0.5, 0.65];

function mmss(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoicePlayer({ url, durationSec }: { url: string; durationSec: number | null }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(durationSec ?? 0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setElapsed(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration)) setTotal(el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setElapsed(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const shown = playing || elapsed > 0 ? elapsed : total;

  return (
    <div className="inline-flex w-fit max-w-full items-center gap-3.5 rounded-full border border-app-border bg-app-surface px-3 py-2">
      <audio ref={audio} src={url} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-accent text-[12px] text-app-on-accent"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="flex h-[24px] items-center gap-[3px]">
        {BARS.map((b, i) => (
          <span
            key={i}
            className={`w-[3px] origin-center rounded-[2px] ${i % 3 === 0 ? "bg-app-accent" : "bg-app-dim"}`}
            style={{
              height: `${b * 100}%`,
              opacity: playing ? 1 : 0.6,
              animation: playing ? `sdWave ${0.8 + i * 0.05}s ease-in-out infinite` : undefined,
            }}
          />
        ))}
      </div>
      <span className="shrink-0 text-[13px] tabular-nums tracking-[0.04em] text-app-dim">{mmss(shown)}</span>
    </div>
  );
}
