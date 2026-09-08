"use client";
// A camcorder-style viewfinder overlay: corner frame ticks, a blinking REC dot,
// battery + 4K/30fps, a focus reticle, a timecode, and the f-stop/ISO line.
// Purely decorative — sits over a video with pointer-events disabled.

export function FilmHud({ recording, timecode }: { recording: boolean; timecode: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 select-none font-mono text-[10px] uppercase tracking-[0.15em] text-white/85">
      {/* corner frame ticks */}
      <span className="absolute left-2 top-2 h-4 w-4 border-l border-t border-white/60" />
      <span className="absolute right-2 top-2 h-4 w-4 border-r border-t border-white/60" />
      <span className="absolute bottom-2 left-2 h-4 w-4 border-b border-l border-white/60" />
      <span className="absolute bottom-2 right-2 h-4 w-4 border-b border-r border-white/60" />

      {/* top-left battery */}
      <div className="absolute left-3.5 top-3 flex items-center gap-[3px]">
        <span className="flex h-2.5 w-5 items-center rounded-[2px] border border-white/70 p-[1px]">
          <span className="h-full w-3/4 bg-white/70" />
        </span>
        <span className="h-1.5 w-[2px] bg-white/70" />
      </div>

      {/* top-center REC */}
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full bg-[#e0403f] ${recording ? "animate-[sdPulse_1s_infinite]" : "opacity-60"}`} />
        <span>Rec</span>
      </div>

      {/* top-right 4K 30fps */}
      <div className="absolute right-3.5 top-3 flex items-center gap-1.5">
        <span className="rounded-[2px] bg-white/85 px-1 text-[9px] text-black">4K</span>
        <span>30fps</span>
      </div>

      {/* center focus reticle */}
      <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-white/80" />
        <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-white/80" />
        <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-white/80" />
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-white/80" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm leading-none text-white/80">+</span>
      </div>

      {/* bottom-center timecode */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[13px] tracking-[0.2em]">{timecode}</div>

      {/* bottom settings line */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 text-white/75">
        <span>1/60</span>
        <span>f2,8</span>
        <span>ISO 200</span>
      </div>

      {/* bottom-left camera glyph */}
      <div className="absolute bottom-3 left-3.5 text-[13px] leading-none text-white/70">◉</div>
    </div>
  );
}
