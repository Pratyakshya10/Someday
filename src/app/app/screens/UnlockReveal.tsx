"use client";
import { useState } from "react";
import type { AppApi } from "../types";
import { ICONS } from "../data";
import { Kicker, Doodle, PrimaryButton, GhostButton, Photo, Waveform, ScreenFrame } from "../components/ui";

export function UnlockReveal({ app }: { app: AppApi }) {
  // 0 sealed · 2 reality check · 3 reflection · 4 the letter
  const [stage, setStage] = useState(0);
  const pred = app.predictions;

  if (stage === 0) {
    return (
      <ScreenFrame collapsed={app.collapsed}>
        <div className="flex min-h-[calc(100vh-10vw)] flex-col items-center justify-center text-center">
          <Doodle className="mb-1.5 block animate-[sdPulse_3s_infinite] !text-[28px]">it&rsquo;s time</Doodle>
          <div className="relative my-[20px] mb-[34px] h-[150px] w-[150px]">
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full shadow-[0_24px_60px_rgba(0,0,0,0.5),inset_0_3px_10px_rgba(255,255,255,0.25)]"
              style={{ background: "radial-gradient(circle at 38% 32%, #e05a4f, var(--color-app-accent) 60%, #7a1f1f)" }}
            >
              <span className="font-serif text-[44px] italic text-[#f6e2d8]">S</span>
            </div>
          </div>
          <h1 className="mb-3 font-serif text-[clamp(34px,5vw,64px)] font-medium">
            A capsule has <span className="italic">unlocked.</span>
          </h1>
          <p className="mx-auto mb-7 max-w-[400px] text-base text-app-dim">Sealed 412 days ago. Written by you, for today.</p>
          <PrimaryButton onClick={() => setStage(pred ? 2 : 4)}>Break the seal</PrimaryButton>
        </div>
      </ScreenFrame>
    );
  }

  if (stage === 2 && pred) {
    return (
      <ScreenFrame collapsed={app.collapsed} pad={false}>
        <div className="flex min-h-[calc(100vh-10vw)] items-center justify-center p-[clamp(28px,5vw,72px)]">
          <div className="max-w-[640px] animate-[sdRise_0.8s_both] text-center">
            <Kicker>Reality check</Kicker>
            <h1 className="mb-[26px] font-serif text-[clamp(30px,4.4vw,54px)] font-medium leading-[1.05]">
              What actually <span className="italic">happened.</span>
            </h1>
            <div className="mb-[30px] grid grid-cols-2 gap-[18px] text-left">
              <div className="rounded-[10px] border border-app-border bg-app-surface p-[22px]">
                <div className="mb-2.5 text-[11px] uppercase tracking-[0.18em] text-app-faint">You predicted</div>
                <p className="font-serif text-[19px] leading-[1.5]">&ldquo;I&rsquo;ll have moved cities and finally learned to be alone.&rdquo;</p>
              </div>
              <div className="rounded-[10px] border border-app-accent bg-app-accent-dim p-[22px]">
                <div className="mb-2.5 text-[11px] uppercase tracking-[0.18em] text-app-accent">What happened</div>
                <p className="font-serif text-[19px] leading-[1.5]">You stayed — but the people around you changed everything.</p>
              </div>
            </div>
            <PrimaryButton onClick={() => setStage(3)}>See the reflection</PrimaryButton>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  if (stage === 3 && pred) {
    return (
      <ScreenFrame collapsed={app.collapsed} pad={false}>
        <div className="flex min-h-[calc(100vh-10vw)] items-center justify-center p-[clamp(28px,5vw,72px)]">
          <div className="max-w-[600px] animate-[sdRise_0.8s_both] text-center">
            <div className="mx-auto mb-[22px] flex h-11 w-11 items-center justify-center rounded-full bg-app-accent-dim text-app-accent">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-[22px] w-[22px]" aria-hidden>
                <path d={ICONS.reveal} />
              </svg>
            </div>
            <div className="mb-[18px] text-[11px] uppercase tracking-[0.22em] text-app-faint">A note from Someday</div>
            <p className="mb-[30px] font-serif text-[clamp(22px,3vw,32px)] italic leading-[1.45]">
              &ldquo;You predicted distance would fix things. It turned out closeness did — you were more restless than reality asked you to be.&rdquo;
            </p>
            <PrimaryButton onClick={() => setStage(4)}>Read the letter</PrimaryButton>
          </div>
        </div>
      </ScreenFrame>
    );
  }

  // stage 4 — the letter, as it was sealed
  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto max-w-[760px] animate-[sdRise_0.9s_both]">
        <Kicker>Opened · sealed 412 days ago</Kicker>
        <div className="rounded-[10px] border border-app-border bg-app-surface p-[clamp(28px,4vw,56px)] shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="mb-1.5 font-serif text-[clamp(28px,4vw,44px)] italic">To — Future Me</div>
          <div className="mb-[26px] font-script text-[22px] text-app-dim">written last November</div>
          <p className="mb-[18px] font-serif text-xl leading-[1.7]">
            Dear future me, by the time you read this I hope the thing you&rsquo;re worried about tonight turned out to be nothing.
          </p>
          <div className="my-[18px] flex w-fit items-center gap-3.5 rounded-[40px] border border-app-border bg-app-accent-dim px-4 py-3">
            <button className="h-[34px] w-[34px] rounded-full bg-app-accent text-[#f6efe4]">▶</button>
            <Waveform active={false} />
            <span className="text-[13px] text-app-dim">0:47</span>
          </div>
          <p className="mb-[22px] font-serif text-xl leading-[1.7]">
            I recorded the rain so you&rsquo;d hear it too. Some things a photo can&rsquo;t hold.
          </p>
          <div className="w-[200px] -rotate-2 self-start bg-[#efe6d3] p-[10px_10px_34px] shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
            <div className="h-[160px] overflow-hidden">
              <Photo tint="#4a3a2e" sepia />
            </div>
            <div className="mt-1.5 text-center font-script text-xl text-[#5a4636]">the last morning there</div>
          </div>
        </div>
        <div className="mt-7 flex items-center gap-4">
          <PrimaryButton onClick={() => app.go("vault")}>Keep in archive</PrimaryButton>
          <GhostButton onClick={() => app.go("new")}>Reply to yourself</GhostButton>
        </div>
      </div>
    </ScreenFrame>
  );
}
