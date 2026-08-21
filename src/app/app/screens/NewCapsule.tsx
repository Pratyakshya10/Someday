"use client";
import type { AppApi } from "../types";
import { TEMPLATES } from "../data";
import { Kicker, Doodle, PrimaryButton, ScreenFrame } from "../components/ui";

export function NewCapsule({ app }: { app: AppApi }) {
  const group = app.capsuleType === "group";

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto max-w-[1040px] animate-[sdRise_0.8s_both]">
        <Kicker>New capsule</Kicker>
        <h1 className="mb-2 font-serif text-[clamp(34px,5vw,66px)] font-medium leading-none tracking-[-0.01em]">
          What are we <span className="italic">sealing?</span>
        </h1>
        <p className="mb-[34px] max-w-[520px] text-base text-app-dim">
          {group
            ? "A shared capsule — everyone adds a note, then it opens for all of you at once."
            : "A letter to yourself, delivered on a day you choose."}
        </p>

        {/* solo / group */}
        <div className="mb-10 inline-flex gap-1 rounded-[10px] border border-app-border bg-app-surface p-1">
          {(["solo", "group"] as const).map((v) => (
            <button
              key={v}
              onClick={() => app.setCapsuleType(v)}
              className={`rounded-[7px] px-[26px] py-2.5 text-sm capitalize tracking-[0.04em] transition-all duration-200 ${
                app.capsuleType === v ? "bg-app-accent text-[#f6efe4]" : "bg-transparent text-app-dim"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* templates */}
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(210px,1fr))]">
          {TEMPLATES.map((tp, i) => {
            const on = app.template === tp.key;
            return (
              <button
                key={tp.key}
                onClick={() => app.setTemplate(tp.key)}
                style={{ animationDelay: `${i * 0.06}s` }}
                className={`flex min-h-[170px] flex-col justify-between rounded-lg border p-[26px_22px_22px] text-left transition-all duration-300 animate-[sdRise_0.6s_both] hover:shadow-[0_18px_44px_rgba(0,0,0,0.35)] ${
                  on ? "border-app-accent bg-app-accent-dim" : "border-app-border bg-app-surface"
                }`}
              >
                <div className={`text-[11px] uppercase tracking-[0.2em] ${on ? "text-app-accent" : "text-app-faint"}`}>
                  0{i + 1}
                </div>
                <div>
                  <div className="mb-2 font-serif text-[25px] font-medium">{tp.label}</div>
                  <Doodle className={`!text-[20px] ${on ? "" : "!text-app-dim"}`}>{tp.hint}</Doodle>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center gap-5">
          <PrimaryButton onClick={() => app.go("editor")}>Begin</PrimaryButton>
          <span className="text-[13px] text-app-faint">
            {group ? "You can invite people after the first draft." : "Autosaves as you write."}
          </span>
        </div>
      </div>
    </ScreenFrame>
  );
}
