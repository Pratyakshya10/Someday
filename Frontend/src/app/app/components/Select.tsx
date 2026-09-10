"use client";
// A custom dropdown that matches the app's glass aesthetic — replaces the
// native <select>, whose option list can't be themed. The menu renders through
// a portal at fixed coordinates so no ancestor's overflow or backdrop-filter
// can clip it, and flips above the trigger when there's no room below.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

export interface SelectOption {
  value: string;
  label: string;
  style?: CSSProperties;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  className = "",
  previewFont = false,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show the trigger label in the selected option's own font. */
  previewFont?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);
  const current = options.find((o) => o.value === value);

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = Math.min(280, options.length * 40 + 12);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuH + 12 && r.top > spaceBelow;
    // Clamp so the menu never runs off the right edge on a narrow screen,
    // even if the trigger itself sits close to it.
    const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
    setCoords({
      left,
      width: r.width,
      top: openUp ? Math.max(8, r.top - menuH - 6) : r.bottom + 6,
    });
  };

  const toggle = () => {
    if (disabled) return;
    if (open) return setOpen(false);
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Scrolling the menu's own option list also dispatches a (bubbling)
    // scroll event — ignore those, or the list would close itself the
    // instant you tried to scroll it. Only an outside scroll (the page
    // moving under the menu) should dismiss it.
    const onScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`flex items-center justify-between gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition-colors hover:border-app-dim disabled:opacity-50 ${className}`}
      >
        <span className={`truncate ${current ? "" : "text-app-faint"}`} style={previewFont ? current?.style : undefined}>
          {current ? current.label : placeholder}
        </span>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-app-faint" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && coords &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onMouseDown={() => setOpen(false)} />
            <div
              ref={menuRef}
              style={{ position: "fixed", left: coords.left, top: coords.top, width: coords.width, maxHeight: 280 }}
              className="z-[61] overflow-y-auto rounded-xl border border-app-border bg-app-panel p-1.5 shadow-[0_20px_50px_rgba(43,38,33,0.18)] backdrop-blur-xl"
            >
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-app-surface ${o.value === value ? "text-app-text" : "text-app-dim"}`}
                >
                  <span className="min-w-0 flex-1 truncate" style={o.style}>{o.label}</span>
                  {o.value === value && <span className="text-app-accent">✓</span>}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
