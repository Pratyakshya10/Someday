"use client";
// Fixed left sidebar: brand, real route navigation, and sign out. The active
// link is derived from the current path.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "../data";
import { signOutAction } from "../actions";
import { useChrome } from "./ChromeContext";
import { Icon } from "./ui";

export function Sidebar() {
  const { collapsed, setCollapsed } = useChrome();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] flex flex-col overflow-hidden border-r border-app-border bg-app-panel backdrop-blur-xl transition-[width] duration-300 ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      {/* header */}
      <div className={`flex items-center border-b border-app-border ${collapsed ? "justify-center py-[22px]" : "justify-between px-5 pb-[18px] pt-[22px]"}`}>
        {!collapsed && (
          <Link href="/app/vault" className="font-serif text-2xl font-semibold italic text-app-text">
            Someday
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand" : "Collapse"}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-app-border text-app-dim"
        >
          <Icon d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} className="h-4 w-4" />
        </button>
      </div>

      {/* navigation */}
      <nav className={`flex flex-col gap-1 border-b border-app-border ${collapsed ? "px-3 py-3.5" : "px-3.5 py-4"}`}>
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
          return (
            <Link
              key={n.href}
              href={n.href}
              title={n.label}
              className={`relative flex items-center gap-3.5 rounded-[10px] text-sm tracking-[0.01em] transition-all duration-200 ${
                collapsed ? "justify-center py-[11px]" : "px-3.5 py-[11px]"
              } ${active ? "bg-app-accent-dim text-app-text" : "bg-transparent text-app-dim"}`}
            >
              {active && <span className="absolute inset-y-[22%] left-0 w-[3px] rounded-[3px] bg-app-accent" />}
              <Icon d={n.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "opacity-100" : "opacity-80"}`} />
              {!collapsed && <span>{n.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* spacer — pushes sign-out to the bottom */}
      <div className="flex-1" />

      {/* sign out */}
      <form action={signOutAction} className={`border-t border-app-border ${collapsed ? "px-3 py-3.5" : "px-3.5 py-4"}`}>
        <button
          type="submit"
          title="Sign out"
          className={`flex w-full items-center gap-3.5 rounded-[10px] text-sm text-app-dim transition-colors duration-200 hover:text-app-text ${
            collapsed ? "justify-center py-[11px]" : "px-3.5 py-[11px]"
          }`}
        >
          <Icon d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </form>
    </aside>
  );
}
