"use client";
// Shared, presentational building blocks for the app screens. Pure Tailwind,
// with inline styles reserved only for genuinely dynamic values (photo tint,
// per-bar animation timing).
import { useEffect, useState, type ReactNode } from "react";
import { useChrome } from "./ChromeContext";

/** A single-path line icon on a 24x24 grid. */
export function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}

/** Accent rule + uppercase label that sits above every screen heading. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3.5">
      <span className="h-px w-8 bg-app-accent" />
      <span className="text-[11.5px] uppercase tracking-[0.28em] text-app-dim">{children}</span>
    </div>
  );
}

/** Handwritten caption. */
export function Doodle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-script text-[21px] leading-[1.05] text-app-dim ${className}`}>{children}</span>;
}

export function PrimaryButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full bg-app-accent px-[26px] py-[11px] text-[12px] uppercase tracking-[0.16em] text-app-on-accent shadow-[0_10px_30px_rgba(43,38,33,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(43,38,33,0.28)] ${className}`}
    >
      {children}
      <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border border-app-border bg-transparent px-[22px] py-2.5 text-[12px] uppercase tracking-[0.16em] text-app-text transition-all duration-300 hover:bg-app-surface ${className}`}
    >
      {children}
    </button>
  );
}

/** Moody photo placeholder — a tinted gradient with a soft highlight + vignette. */
export function Photo({ tint, className = "", sepia = false }: { tint: string; className?: string; sepia?: boolean }) {
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: `linear-gradient(150deg, ${tint} 0%, #0f0c0b 130%)`, filter: sepia ? "sepia(0.4)" : undefined }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(90% 80% at 40% 30%, rgba(255,240,220,0.16), transparent 60%)" }} />
      <div className="absolute inset-0 shadow-[inset_0_0_90px_rgba(0,0,0,0.6)]" />
    </div>
  );
}

/** A little animated voice-note waveform. */
export function Waveform({ active }: { active: boolean }) {
  const bars = [0.4, 0.7, 0.5, 1, 0.65, 0.45, 0.85, 0.6, 0.35, 0.75, 0.5, 0.9, 0.55, 0.7, 0.4, 0.8];
  return (
    <div className="flex h-[26px] items-center gap-[3px]">
      {bars.map((b, i) => (
        <span
          key={i}
          className={`w-[3px] origin-center rounded-[2px] ${i % 3 === 0 ? "bg-app-accent" : "bg-app-dim"} ${active ? "opacity-100" : "opacity-55"}`}
          style={{ height: `${b * 100}%`, animation: active ? `sdWave ${0.8 + i * 0.05}s ease-in-out infinite` : undefined }}
        />
      ))}
    </div>
  );
}

/** Live-ish countdown. Ticks client-side only, so it never mismatches on hydrate. */
export function Countdown({ days, gap = "gap-3.5" }: { days: number; gap?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    // Kick once right after mount (async, so it's not a setState *during* the
    // effect), then keep ticking every second.
    const kick = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, []);

  const h = now ? 23 - now.getHours() : 0;
  const m = now ? 59 - now.getMinutes() : 0;
  const s = now ? 59 - now.getSeconds() : 0;
  const blocks: [number, string][] = [[days, "days"], [h, "hrs"], [m, "min"], [s, "sec"]];

  return (
    <div className={`flex ${gap}`}>
      {blocks.map(([val, label]) => (
        <div key={label} className="text-center">
          <div className="min-w-[42px] font-serif text-[clamp(22px,3vw,34px)] font-semibold leading-none text-app-text">
            {String(val).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[9.5px] uppercase tracking-[0.2em] text-app-faint">{label}</div>
        </div>
      ))}
    </div>
  );
}

/** Fixed film-grain overlay. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-[-50%] z-[1] mix-blend-soft-light opacity-[0.05]"
      style={{
        animation: "sdGrain 1.1s steps(2) infinite",
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/** Fixed vignette overlay. */
export function Vignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background: "radial-gradient(120% 90% at 50% 42%, rgba(0,0,0,0) 52%, rgba(43,38,33,0.12) 100%)" }}
    />
  );
}

/** The scrolling area to the right of the fixed sidebar. */
export function ScreenFrame({ children, pad = true }: { children: ReactNode; pad?: boolean }) {
  const { collapsed } = useChrome();
  return (
    <main
      className={`relative z-[2] min-h-screen text-app-text transition-[margin] duration-300 ${collapsed ? "ml-[76px]" : "ml-[248px]"} ${pad ? "p-[clamp(16px,3vw,40px)]" : ""}`}
    >
      {children}
    </main>
  );
}
