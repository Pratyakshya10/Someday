"use client";
import { useState, useTransition } from "react";
import { TEMPLATES } from "../data";
import { createDraftAction } from "../actions";
import type { CapsuleType, TemplateKey } from "../types";
import { Kicker, Doodle, PrimaryButton, ScreenFrame } from "../components/ui";

export function NewCapsule({ initialType = "solo" }: { initialType?: CapsuleType }) {
  const [type, setType] = useState<CapsuleType>(initialType);
  const [template, setTemplate] = useState<TemplateKey>("future");
  const [pending, startTransition] = useTransition();
  const group = type === "group";

  const begin = () => startTransition(() => createDraftAction({ type, template }));

  return (
    <ScreenFrame>
      <div className="mx-auto max-w-[1040px] animate-[sdRise_0.8s_both]">
        <Kicker>New capsule</Kicker>
        <h1 className="mb-2 font-serif text-[clamp(24px,3.2vw,40px)] font-medium leading-none tracking-[-0.01em]">
          What are we <span className="italic">sealing?</span>
        </h1>
        <p className="mb-6 max-w-[520px] text-sm text-app-dim">
          {group
            ? "A shared capsule — everyone adds a note, then it opens for all of you at once."
            : "A letter to yourself, delivered on a day you choose."}
        </p>

        {/* solo / group */}
        <div className="mb-7 inline-flex gap-1 rounded-[10px] border border-app-border bg-app-surface p-1">
          {(["solo", "group"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setType(v)}
              className={`rounded-[7px] px-[22px] py-2 text-sm capitalize tracking-[0.04em] transition-all duration-200 ${
                type === v ? "bg-app-accent text-app-on-accent" : "bg-transparent text-app-dim"
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* templates */}
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
          {TEMPLATES.map((tp, i) => {
            const on = template === tp.key;
            return (
              <button
                key={tp.key}
                onClick={() => setTemplate(tp.key)}
                style={{ animationDelay: `${i * 0.06}s` }}
                className={`flex min-h-[128px] flex-col justify-between rounded-lg border p-[18px_16px_16px] text-left transition-all duration-300 animate-[sdRise_0.6s_both] hover:shadow-[0_18px_44px_rgba(43,38,33,0.1)] ${
                  on ? "border-app-accent bg-app-accent-dim" : "border-app-border bg-app-surface"
                }`}
              >
                <div className={`text-[10.5px] uppercase tracking-[0.2em] ${on ? "text-app-accent" : "text-app-faint"}`}>
                  0{i + 1}
                </div>
                <div>
                  <div className="mb-1 font-serif text-[19px] font-medium">{tp.label}</div>
                  <Doodle className={`!text-[16px] ${on ? "" : "!text-app-dim"}`}>{tp.hint}</Doodle>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex items-center gap-5">
          <PrimaryButton onClick={begin} className={pending ? "pointer-events-none opacity-70" : ""}>
            {pending ? "Creating…" : "Begin"}
          </PrimaryButton>
          <span className="text-[13px] text-app-faint">
            {group ? "You can invite people after the first draft." : "Autosaves as you write."}
          </span>
        </div>
      </div>
    </ScreenFrame>
  );
}
