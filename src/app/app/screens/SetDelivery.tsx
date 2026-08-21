"use client";
import type { AppApi } from "../types";
import { SAMPLE } from "../data";
import { Kicker, PrimaryButton, Countdown, ScreenFrame } from "../components/ui";

function Calendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const selected = 1;
  return (
    <div className="max-w-[340px] rounded-[10px] border border-app-border bg-app-surface p-[22px]">
      <div className="mb-4 flex items-center justify-between">
        <button className="text-lg text-app-dim">‹</button>
        <span className="font-serif text-xl">January 2027</span>
        <button className="text-lg text-app-dim">›</button>
      </div>
      <div className="mb-1.5 grid grid-cols-7 gap-1 text-[11px] text-app-faint">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {[null, null, null, null, ...days].map((d, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-md text-[13px] ${
              d === selected ? "bg-app-accent text-[#f6efe4]" : d ? "text-app-text" : "text-transparent"
            }`}
          >
            {d ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[460px] rounded-[10px] border border-dashed border-app-border bg-app-surface p-[40px_34px] text-center">
      <div className="mb-2.5 font-script text-2xl text-app-accent">coming soon</div>
      <div className="mb-3 font-serif text-3xl">{title}</div>
      <p className="text-[15px] leading-[1.6] text-app-dim">{body}</p>
    </div>
  );
}

export function SetDelivery({ app }: { app: AppApi }) {
  const ut = app.unlockType;

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto max-w-[960px] animate-[sdRise_0.8s_both]">
        <Kicker>Set delivery</Kicker>
        <h1 className="mb-2.5 font-serif text-[clamp(34px,5vw,66px)] font-medium leading-none tracking-[-0.01em]">
          Delivered on a date <span className="italic">you choose.</span>
        </h1>
        <p className="mb-5 max-w-[520px] text-base text-app-dim">
          Switch the unlock type in the sidebar. Location and Milestone are on the way.
        </p>

        <div className="flex flex-wrap items-start gap-11">
          {ut === "date" ? (
            <Calendar />
          ) : ut === "location" ? (
            <ComingSoon title="Unlock by place" body="Arrive somewhere that matters — a childhood street, a summit — and the capsule opens when you're standing there." />
          ) : (
            <ComingSoon title="Unlock by milestone" body="Tie it to a life event: a graduation, a wedding, a birthday. We'll listen for the moment." />
          )}

          <div className="flex-1 basis-[300px]">
            <div className="mb-3.5 text-[11px] uppercase tracking-[0.2em] text-app-faint">It will open in</div>
            <Countdown days={SAMPLE[1].days} />
            <p className="mt-5 font-script text-2xl text-app-dim">
              {ut === "date" ? "→ January 1, 2027 — a clean place to start" : "we'll notify you the day it's ready"}
            </p>
            <PrimaryButton onClick={() => app.go("sealing")} className="mt-3.5">Seal it</PrimaryButton>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
