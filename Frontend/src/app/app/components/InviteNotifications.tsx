"use client";
// The sidebar's "you've been invited" notification — a bell with a count that
// opens a small list of pending group-capsule invites, each linking straight
// into the existing /app/join/[token] accept flow.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { PendingInviteView } from "../types";
import { Icon } from "./ui";

const roleLabel = (r: PendingInviteView["role"]) => (r === "viewer" ? "Can view" : "Can edit");

export function InviteNotifications({ invites, collapsed }: { invites: PendingInviteView[]; collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number } | null>(null);

  const place = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 260;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setCoords({ left, width, top: r.bottom + 6 });
  };

  const toggle = () => {
    if (open) return setOpen(false);
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        title="Pending invites"
        className={`relative flex items-center gap-3.5 rounded-[10px] px-3.5 py-[11px] text-sm tracking-[0.01em] transition-all duration-200 ${
          collapsed ? "md:justify-center md:px-0" : ""
        } ${open ? "bg-app-accent-dim text-app-text" : "bg-transparent text-app-dim"}`}
      >
        <span className="relative shrink-0">
          <Icon
            d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            className="h-[18px] w-[18px] opacity-90"
          />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-app-accent px-1 text-[9px] font-medium leading-none text-app-on-accent">
            {invites.length}
          </span>
        </span>
        <span className={collapsed ? "md:hidden" : ""}>{invites.length === 1 ? "1 invite" : `${invites.length} invites`}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <>
            {/* above the sidebar's own z-[100] so the menu isn't tucked behind it */}
            <div className="fixed inset-0 z-[105]" onMouseDown={() => setOpen(false)} />
            <div
              style={{ position: "fixed", left: coords.left, top: coords.top, width: coords.width, maxHeight: 320 }}
              className="z-[106] overflow-y-auto rounded-xl border border-app-border bg-app-panel p-1.5 shadow-[0_20px_50px_rgba(43,38,33,0.18)] backdrop-blur-xl"
            >
              <div className="px-2.5 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.18em] text-app-faint">
                {invites.length === 1 ? "Pending invite" : "Pending invites"}
              </div>
              {invites.map((i) => (
                <Link
                  key={i.id}
                  href={`/app/join/${i.token}`}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left text-sm text-app-text transition-colors hover:bg-app-surface"
                >
                  <span className="truncate">Join &ldquo;{i.capsuleTitle || "Untitled capsule"}&rdquo;</span>
                  <span className="text-[11px] text-app-faint">{roleLabel(i.role)}</span>
                </Link>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
