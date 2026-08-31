"use client";
// In-browser recorder for a voice note or a short film. Opens the mic (and
// camera, for video), records with MediaRecorder, lets you preview and either
// keep or retake. Hands the finished clip back as a File.

import { useEffect, useRef, useState } from "react";

type Phase = "requesting" | "ready" | "recording" | "recorded" | "error";

function pickMime(mode: "voice" | "video"): string {
  const candidates =
    mode === "voice"
      ? ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
      : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return mode === "voice" ? "audio/webm" : "video/webm";
}

function mmss(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function Recorder({
  mode,
  maxSec = mode === "video" ? 15 : 120,
  onDone,
  onClose,
}: {
  mode: "voice" | "video";
  maxSec?: number;
  onDone: (file: File, durationSec: number) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("requesting");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewVideo = useRef<HTMLVideoElement | null>(null);
  const startedAt = useRef(0);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  const [result, setResult] = useState<{ blob: Blob; url: string; duration: number; mime: string } | null>(null);

  // Open the mic/camera on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          mode === "voice" ? { audio: true } : { audio: true, video: { facingMode: "user" } },
        );
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (mode === "video" && previewVideo.current) {
          previewVideo.current.srcObject = stream;
          previewVideo.current.muted = true;
          await previewVideo.current.play().catch(() => {});
        }
        setPhase("ready");
      } catch {
        setError("We couldn't access your " + (mode === "voice" ? "microphone" : "camera") + ". Check permissions, or upload a file instead.");
        setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
      if (ticker.current) clearInterval(ticker.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [mode]);

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime(mode);
    chunksRef.current = [];
    const rec = new MediaRecorder(stream, { mimeType: mime });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstart = () => {
      // Stamp the start time inside the callback (not during render).
      startedAt.current = Date.now();
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      const duration = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
      setResult({ blob, url: URL.createObjectURL(blob), duration, mime });
      setPhase("recorded");
      if (ticker.current) clearInterval(ticker.current);
    };
    recRef.current = rec;
    rec.start();
    setElapsed(0);
    setPhase("recording");
    ticker.current = setInterval(() => {
      if (!startedAt.current) return;
      const e = Math.round((Date.now() - startedAt.current) / 1000);
      setElapsed(e);
      if (e >= maxSec) stop();
    }, 250);
  };

  const stop = () => {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  };

  const retake = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setElapsed(0);
    setPhase("ready");
  };

  const keep = () => {
    if (!result) return;
    const ext = result.mime.includes("mp4") ? (mode === "voice" ? "m4a" : "mp4") : "webm";
    const file = new File([result.blob], `${mode}-${Date.now()}.${ext}`, { type: result.mime });
    onDone(file, result.duration);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(43,38,33,0.35)] p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-[440px] rounded-2xl border border-app-border bg-app-panel p-6 shadow-[0_30px_80px_rgba(43,38,33,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-xl">{mode === "voice" ? "Record a voice note" : "Record a short film"}</h3>
          <button onClick={onClose} aria-label="Close" className="text-app-dim hover:text-app-text">✕</button>
        </div>

        {mode === "video" && phase !== "recorded" && (
          <div className="mb-4 aspect-video w-full overflow-hidden rounded-lg border border-app-border bg-black">
            <video ref={previewVideo} className="h-full w-full object-cover" playsInline />
          </div>
        )}

        {phase === "recorded" && result && (
          <div className="mb-4">
            {mode === "video" ? (
              <video src={result.url} controls className="aspect-video w-full rounded-lg border border-app-border bg-black" />
            ) : (
              <audio src={result.url} controls className="w-full" />
            )}
          </div>
        )}

        {phase === "error" ? (
          <p className="mb-4 text-sm text-app-dim">{error}</p>
        ) : (
          <div className="mb-5 text-center">
            <div className="font-serif text-3xl tabular-nums">{mmss(elapsed)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-app-faint">
              {phase === "requesting" && "Requesting access…"}
              {phase === "ready" && `up to ${mmss(maxSec)}`}
              {phase === "recording" && "recording"}
              {phase === "recorded" && "ready — keep it?"}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {phase === "ready" && (
            <button
              onClick={start}
              className="inline-flex items-center gap-2 rounded-full bg-app-accent px-6 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-on-accent"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[#c0392b]" /> Start
            </button>
          )}
          {phase === "recording" && (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-app-border px-6 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-text"
            >
              <span className="h-2.5 w-2.5 rounded-[2px] bg-app-text" /> Stop
            </button>
          )}
          {phase === "recorded" && (
            <>
              <button onClick={retake} className="rounded-full border border-app-border px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-text">
                Retake
              </button>
              <button onClick={keep} className="rounded-full bg-app-accent px-6 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-on-accent">
                Use this
              </button>
            </>
          )}
          {phase === "error" && (
            <button onClick={onClose} className="rounded-full border border-app-border px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-text">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
