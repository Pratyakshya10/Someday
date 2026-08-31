"use client";
// A classic month-grid date picker. Cream selected day, serif month title,
// hairline arrows — matches the premium reference. Purely controlled: it owns
// only which month is on screen; the chosen date lives in the parent.

import { useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function Calendar({
  value,
  min,
  onChange,
  label = "Delivered on",
}: {
  value: string;
  min: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const selected = parse(value);
  const minDate = parse(min);

  const [view, setView] = useState({ year: selected.getFullYear(), month: selected.getMonth() });

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  // Can we page back? Only if the month before still contains a selectable day.
  const lastOfPrev = new Date(view.year, view.month, 0); // day 0 = last of prev month
  const canPrev = lastOfPrev >= new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-app-border bg-app-panel p-5 backdrop-blur-xl">
      <div className="mb-4 text-[11px] uppercase tracking-[0.22em] text-app-faint">{label}</div>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && shift(-1)}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-app-border text-app-dim transition-colors hover:text-app-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-serif text-xl">
          {MONTHS[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-app-border text-app-dim transition-colors hover:text-app-text"
        >
          ›
        </button>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1 text-[11px] text-app-faint">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const thisIso = iso(view.year, view.month, d);
          const thisDate = parse(thisIso);
          const isSelected = thisIso === value;
          const disabled = thisDate < minDate;
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(thisIso)}
              className={`flex aspect-square items-center justify-center rounded-full text-[13px] transition-colors ${
                isSelected
                  ? "bg-app-accent font-medium text-app-on-accent"
                  : disabled
                    ? "cursor-not-allowed text-app-faint/50"
                    : "text-app-text hover:bg-app-surface"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
