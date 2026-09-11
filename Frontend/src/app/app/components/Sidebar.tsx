"use client";
// Left sidebar: brand, real route navigation, and sign out. The active link
// is derived from the current path.
//
// Below md it's an off-canvas drawer (closed by default, opened by a
// hamburger button, dismissed by its own ✕, the backdrop, or navigating) —
// always showing full labels, ignoring the desktop collapse preference. At md
// and up it's the original fixed, collapsible column.

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "../data";
import { signOutAction } from "../actions";
import type { PendingInviteView } from "../types";
import { useChrome } from "./ChromeContext";
import { Icon } from "./ui";
import { InviteNotifications } from "./InviteNotifications";

export function Sidebar({ invites }: { invites: PendingInviteView[] }) {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useChrome();
  const pathname = usePathname();

  // Close the drawer on navigation — otherwise it'd stay open over the page
  // you just tapped through to.
  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* hamburger — mobile only, opens the drawer */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="fixed left-4 top-4 z-[90] flex h-10 w-10 items-center justify-center rounded-full border border-app-border bg-app-panel text-app-text shadow-[0_6px_18px_rgba(43,38,33,0.12)] backdrop-blur-xl md:hidden"
      >
        <Icon d="M4 7h16M4 12h16M4 17h16" className="h-5 w-5" />
      </button>

      {/* backdrop — mobile only, shown while the drawer is open */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden
          className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[100] flex w-[248px] flex-col overflow-hidden border-r border-app-border bg-app-panel backdrop-blur-xl transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${collapsed ? "md:w-[76px]" : "md:w-[248px]"}`}
      >
        {/* header */}
        <div
          className={`flex items-center justify-between border-b border-app-border px-5 pb-[18px] pt-[22px] ${
            collapsed ? "md:justify-center md:px-0 md:py-[22px]" : ""
          }`}
        >
          <Link href="/app/vault" className={`font-logo text-3xl text-app-text ${collapsed ? "md:hidden" : ""}`}>
            Someday
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
            className="hidden h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-app-border text-app-dim md:flex"
          >
            <Icon d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            title="Close"
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-app-border text-app-dim md:hidden"
          >
            <Icon d="M6 6l12 12M18 6L6 18" className="h-4 w-4" />
          </button>
        </div>

        {/* navigation */}
        <nav className={`flex flex-col gap-1 border-b border-app-border px-3.5 py-4 ${collapsed ? "md:px-3 md:py-3.5" : ""}`}>
          {invites.length > 0 && <InviteNotifications invites={invites} collapsed={collapsed} />}
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                title={n.label}
                className={`relative flex items-center gap-3.5 rounded-[10px] px-3.5 py-[11px] text-sm tracking-[0.01em] transition-all duration-200 ${
                  collapsed ? "md:justify-center md:px-0" : ""
                } ${active ? "bg-app-accent-dim text-app-text" : "bg-transparent text-app-dim"}`}
              >
                {active && <span className="absolute inset-y-[22%] left-0 w-[3px] rounded-[3px] bg-app-accent" />}
                <Icon d={n.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "opacity-100" : "opacity-80"}`} />
                <span className={collapsed ? "md:hidden" : ""}>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* spacer — pushes sign-out to the bottom */}
        <div className="flex-1" />

        {/* sign out */}
        <form action={signOutAction} className={`border-t border-app-border px-3.5 py-4 ${collapsed ? "md:px-3 md:py-3.5" : ""}`}>
          <button
            type="submit"
            title="Sign out"
            className={`flex w-full items-center gap-3.5 rounded-[10px] px-3.5 py-[11px] text-sm text-app-dim transition-colors duration-200 hover:text-app-text ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <Icon d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" className="h-[18px] w-[18px] shrink-0" />
            <span className={collapsed ? "md:hidden" : ""}>Sign out</span>
          </button>
        </form>
      </aside>
    </>
  );
}
