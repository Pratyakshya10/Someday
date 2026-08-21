"use client";
import type { AppApi } from "../types";
import { SAMPLE, OPENED, type CapsuleShape } from "../data";
import { Kicker, PrimaryButton, Photo, Countdown, Icon, ScreenFrame } from "../components/ui";

/** A locked object — envelope, box, or film reel — over a tinted photo. */
function CapsuleObject({ obj, tint }: { obj: CapsuleShape; tint: string }) {
  return (
    <div className="relative aspect-[1.2] w-full overflow-hidden rounded-[10px]">
      <Photo tint={tint} />
      {obj === "reel" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex aspect-square w-[46%] items-center justify-center rounded-full border-[3px] border-[rgba(240,230,216,0.5)]">
            <div className="aspect-square w-[34%] rounded-full border-[3px] border-[rgba(240,230,216,0.5)]" />
          </div>
        </div>
      )}
      {obj === "box" && (
        <>
          <div className="absolute inset-y-0 left-1/2 w-[14px] -translate-x-1/2 bg-[rgba(240,230,216,0.16)]" />
          <div className="absolute inset-x-0 top-[40%] h-[14px] bg-[rgba(240,230,216,0.16)]" />
        </>
      )}
      {obj === "envelope" && (
        <div className="absolute inset-x-0 top-0 h-[56%] border-b-2 border-[rgba(240,230,216,0.28)] bg-[rgba(240,230,216,0.06)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
      )}
    </div>
  );
}

export function Vault({ app }: { app: AppApi }) {
  const list = app.sampleData === "empty" ? [] : app.sampleData === "one" ? SAMPLE.slice(0, 1) : SAMPLE;
  const opened = app.capsuleState === "unlocked" || app.sampleData === "empty" ? [] : OPENED;
  const locked = app.capsuleState !== "unlocked";

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto max-w-[1180px] animate-[sdRise_0.7s_both]">
        <div className="mb-[34px] flex flex-wrap items-end justify-between gap-4">
          <div>
            <Kicker>Your vault</Kicker>
            <h1 className="font-serif text-[clamp(34px,5vw,66px)] font-medium leading-none tracking-[-0.01em]">
              Sealed, and <span className="italic">waiting.</span>
            </h1>
          </div>
          <PrimaryButton onClick={() => app.go("new")}>New capsule</PrimaryButton>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-[80px_30px] text-center">
            <div className="mb-2.5 font-script text-[28px] text-app-dim">nothing sealed yet</div>
            <div className="mb-4 font-serif text-3xl">Your vault is empty</div>
            <PrimaryButton onClick={() => app.go("new")} className="mt-1">Write your first letter</PrimaryButton>
          </div>
        ) : (
          <div className="[column-gap:22px] [column-width:290px]">
            {list.map((c) => (
              <div
                key={c.id}
                onClick={() => app.go("reveal")}
                className="mb-[22px] block cursor-pointer overflow-hidden rounded-xl border border-app-border bg-app-surface shadow-[0_14px_34px_rgba(0,0,0,0.3)] transition-all duration-300 [break-inside:avoid] hover:-translate-y-[5px] hover:shadow-[0_26px_60px_rgba(0,0,0,0.5)]"
              >
                <div className="relative">
                  <CapsuleObject obj={c.obj} tint={c.tint} />
                  <div className={`absolute inset-0 ${locked ? "bg-gradient-to-b from-black/15 to-black/55" : "bg-gradient-to-b from-black/10 to-black/35"}`} />
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-[5px] text-[10px] uppercase tracking-[0.14em] text-[#f0e6d8]">
                    <Icon
                      d={locked ? "M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10H5z" : "M6 10V8a6 6 0 0 1 11-2M5 10h14v10H5z"}
                      className="h-[11px] w-[11px]"
                    />
                    {locked ? "Sealed" : "Open"}
                  </div>
                </div>
                <div className="p-[18px_18px_20px]">
                  <div className="mb-1.5 text-[11px] uppercase tracking-[0.14em] text-app-faint">{c.to}</div>
                  <div className={`font-serif text-[26px] font-medium ${locked ? "mb-3.5" : "mb-2"}`}>{c.title}</div>
                  {locked ? <Countdown days={c.days} gap="gap-2.5" /> : <p className="text-sm leading-[1.55] text-app-dim">{c.excerpt}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {opened.length > 0 && (
          <div className="mt-14">
            <div className="mb-[22px] flex items-center gap-4">
              <span className="font-serif text-[28px] italic text-app-dim">Opened</span>
              <span className="h-px flex-1 bg-app-border" />
            </div>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {opened.map((c) => (
                <div
                  key={c.id}
                  onClick={() => app.go("reveal")}
                  className="flex cursor-pointer gap-3.5 overflow-hidden rounded-[10px] border border-app-border bg-app-surface"
                >
                  <div className="w-[92px] shrink-0">
                    <Photo tint={c.tint} />
                  </div>
                  <div className="p-[14px_14px_14px_4px]">
                    <div className="mb-1 text-[11px] text-app-faint">{c.to}</div>
                    <div className="mb-1.5 font-serif text-xl">{c.title}</div>
                    <p className="text-[13px] leading-[1.5] text-app-dim">{c.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScreenFrame>
  );
}
