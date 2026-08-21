"use client";
// Fixed left sidebar: app navigation + live prototype controls (theme, capsule
// type, predictions, unlock type, capsule state, sample data).
import type { AppApi } from "../types";
import { NAV, THEME_SWATCHES } from "../data";
import { Icon } from "./ui";

/** One labelled group of pill options. */
function Segment<T extends string | boolean>({
  label, options, value, onChange, collapsed,
}: {
  label: string;
  options: { v: T; l: string }[];
  value: T;
  onChange: (v: T) => void;
  collapsed: boolean;
}) {
  if (collapsed) return null;
  return (
    <div className="mb-4">
      <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-app-faint">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={String(o.v)}
              onClick={() => onChange(o.v)}
              className={`cursor-pointer rounded-[7px] border px-2.5 py-[7px] text-xs tracking-[0.02em] whitespace-nowrap transition-all duration-200 ${
                on ? "border-app-accent bg-app-accent-dim text-app-text" : "border-app-border bg-transparent text-app-dim"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ app }: { app: AppApi }) {
  const { collapsed, screen } = app;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] flex flex-col overflow-hidden border-r border-app-border bg-app-panel backdrop-blur-xl transition-[width] duration-300 ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      {/* header */}
      <div className={`flex items-center border-b border-app-border ${collapsed ? "justify-center py-[22px]" : "justify-between px-5 pb-[18px] pt-[22px]"}`}>
        {!collapsed && <span className="font-serif text-2xl font-semibold italic text-app-text">Someday</span>}
        <button
          onClick={() => app.setCollapsed(!collapsed)}
          title="Collapse"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-[7px] border border-app-border text-app-dim"
        >
          <Icon d={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} className="h-4 w-4" />
        </button>
      </div>

      {/* navigation */}
      <div className={`flex flex-col gap-1 border-b border-app-border ${collapsed ? "px-3 py-3.5" : "px-3.5 py-4"}`}>
        {NAV.map((n) => {
          const active = screen === n.key;
          return (
            <button
              key={n.key}
              onClick={() => app.go(n.key)}
              title={n.label}
              className={`relative flex items-center gap-3.5 rounded-[10px] text-sm tracking-[0.01em] transition-all duration-200 ${
                collapsed ? "justify-center py-[11px]" : "px-3.5 py-[11px]"
              } ${active ? "bg-app-accent-dim text-app-text" : "bg-transparent text-app-dim"}`}
            >
              {active && <span className="absolute inset-y-[22%] left-0 w-[3px] rounded-[3px] bg-app-accent" />}
              <Icon d={n.icon} className={`h-[18px] w-[18px] shrink-0 ${active ? "opacity-100" : "opacity-80"}`} />
              {!collapsed && <span>{n.label}</span>}
            </button>
          );
        })}
      </div>

      {/* controls */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? "px-3 py-3.5" : "px-[18px] pb-6 pt-[18px]"}`}>
        {collapsed ? (
          <div className="mx-auto text-[10px] uppercase tracking-[0.2em] text-app-faint [writing-mode:vertical-rl]">Controls</div>
        ) : (
          <div className="mb-3.5 text-[10.5px] uppercase tracking-[0.2em] text-app-faint">Prototype controls</div>
        )}

        {!collapsed && (
          <>
            <div className="mb-[18px]">
              <div className="mb-2 text-[10.5px] uppercase tracking-[0.18em] text-app-faint">Theme</div>
              <div className="flex flex-wrap gap-2">
                {THEME_SWATCHES.map((th) => {
                  const on = app.theme === th.key;
                  return (
                    <button
                      key={th.key}
                      onClick={() => app.setTheme(th.key)}
                      title={th.name}
                      className={`relative h-[30px] w-[30px] rounded-lg border-2 transition-all duration-200 ${on ? "" : "border-transparent"}`}
                      style={{ background: th.bg, borderColor: on ? th.accent : "transparent", boxShadow: on ? `0 0 0 1px ${th.accent}` : undefined }}
                    >
                      <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full" style={{ background: th.accent }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <Segment label="Capsule type" collapsed={collapsed} value={app.capsuleType} onChange={app.setCapsuleType}
              options={[{ v: "solo", l: "Solo" }, { v: "group", l: "Group" }]} />
            <Segment label="Predictions layer" collapsed={collapsed} value={app.predictions} onChange={app.setPredictions}
              options={[{ v: true, l: "On" }, { v: false, l: "Off" }]} />
            <Segment label="Unlock type" collapsed={collapsed} value={app.unlockType} onChange={app.setUnlockType}
              options={[{ v: "date", l: "Date" }, { v: "location", l: "Location" }, { v: "milestone", l: "Milestone" }]} />
            <Segment label="Capsule state" collapsed={collapsed} value={app.capsuleState} onChange={app.setCapsuleState}
              options={[{ v: "draft", l: "Draft" }, { v: "sealed", l: "Sealed" }, { v: "unlocked", l: "Unlocked" }]} />
            <Segment label="Sample data" collapsed={collapsed} value={app.sampleData} onChange={app.setSampleData}
              options={[{ v: "empty", l: "Empty" }, { v: "one", l: "One" }, { v: "many", l: "Many" }]} />
          </>
        )}
      </div>
    </aside>
  );
}
