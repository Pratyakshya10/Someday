"use client";
// A themed date + time picker that replaces the native datetime-local control
// (whose calendar popup can't be styled). Value is the same
// "YYYY-MM-DDTHH:mm" string the native input used, so callers are unchanged.
// The popover renders through a portal at fixed coordinates so it isn't clipped
// by any scroll container or backdrop-filter above it.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Select } from "./Select";

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromValue(v: string): Date | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: pad(i), label: pad(i) }));
const MERIDIEM = [{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }];

export function DateTimeField({
  value,
  onChange,
  min,
  placeholder = "Pick a date & time",
}: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  placeholder?: string;
}) {
  const selected = fromValue(value);
  const minDate = min ? fromValue(min) : null;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected ?? minDate ?? new Date());
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = 320;
    const menuH = 380;
    const openUp = window.innerHeight - r.bottom < menuH + 12 && r.top > menuH;
    setCoords({
      left: Math.max(12, Math.min(r.left, window.innerWidth - w - 12)),
      top: openUp ? Math.max(8, r.top - menuH - 6) : r.bottom + 6,
    });
  };

  const openMenu = () => {
    setView(selected ?? minDate ?? new Date());
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("resize", place);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // The time parts, defaulting to 12:00 PM when nothing is chosen yet.
  const base = selected ?? new Date(new Date().setHours(12, 0, 0, 0));
  const h24 = base.getHours();
  const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const meridiem = h24 < 12 ? "AM" : "PM";

  const emit = (d: Date) => {
    if (minDate && d < minDate) onChange(toValue(minDate));
    else onChange(toValue(d));
  };

  const pickDay = (day: Date) => {
    const d = new Date(day);
    d.setHours(base.getHours(), base.getMinutes(), 0, 0);
    emit(d);
  };
  const setHour = (v: string) => {
    const hr = +v % 12 + (meridiem === "PM" ? 12 : 0);
    const d = new Date(base);
    d.setHours(hr);
    emit(d);
  };
  const setMinute = (v: string) => {
    const d = new Date(base);
    d.setMinutes(+v);
    emit(d);
  };
  const setMeridiem = (v: string) => {
    const d = new Date(base);
    const hr12 = hour12 % 12;
    d.setHours(v === "PM" ? hr12 + 12 : hr12);
    emit(d);
  };

  // Build the calendar grid for the viewed month.
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));

  const today = new Date();
  const minDay = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()) : null;

  const label = selected
    ? selected.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
    : placeholder;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2.5 text-sm outline-none transition-colors hover:border-app-dim"
      >
        <span className={selected ? "text-app-text" : "text-app-faint"}>{label}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-app-faint" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      {open && coords &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onMouseDown={() => setOpen(false)} />
            <div
              style={{ position: "fixed", left: coords.left, top: coords.top, width: 320 }}
              className="z-[61] rounded-2xl border border-app-border bg-app-panel p-4 shadow-[0_24px_60px_rgba(43,38,33,0.2)] backdrop-blur-xl"
            >
              {/* month header */}
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} aria-label="Previous month" className="flex h-7 w-7 items-center justify-center rounded-md text-app-dim transition-colors hover:bg-app-surface hover:text-app-text">‹</button>
                <div className="font-serif text-[15px] text-app-text">{MONTHS[view.getMonth()]} {view.getFullYear()}</div>
                <button type="button" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} aria-label="Next month" className="flex h-7 w-7 items-center justify-center rounded-md text-app-dim transition-colors hover:bg-app-surface hover:text-app-text">›</button>
              </div>

              {/* weekday labels */}
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.1em] text-app-faint">
                {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
              </div>

              {/* days */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />;
                  const disabled = minDay ? day < minDay : false;
                  const isSel = selected ? sameDay(day, selected) : false;
                  const isToday = sameDay(day, today);
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={disabled}
                      onClick={() => pickDay(day)}
                      className={`flex h-8 items-center justify-center rounded-md text-[13px] transition-colors ${
                        isSel
                          ? "bg-app-accent text-app-on-accent"
                          : disabled
                            ? "cursor-not-allowed text-app-faint/50"
                            : `text-app-text hover:bg-app-surface ${isToday ? "ring-1 ring-app-border" : ""}`
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* time */}
              <div className="mt-4 flex items-center gap-2 border-t border-app-border pt-4">
                <span className="text-[11px] uppercase tracking-[0.16em] text-app-faint">Time</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Select value={String(hour12)} onChange={setHour} options={HOURS} className="!px-2 !py-1.5" />
                  <span className="text-app-dim">:</span>
                  <Select value={pad(base.getMinutes())} onChange={setMinute} options={MINUTES} className="!px-2 !py-1.5" />
                  <Select value={meridiem} onChange={setMeridiem} options={MERIDIEM} className="!px-2 !py-1.5" />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-app-accent px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-app-on-accent">Done</button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
