"use client";
import type { AppApi } from "../types";
import { ICONS, PROMPTS } from "../data";
import { Doodle, PrimaryButton, Photo, Waveform, Icon, ScreenFrame } from "../components/ui";

const MEDIA = [
  { label: "Voice note", hint: "record inline", icon: ICONS.voice },
  { label: "Photos", hint: "up to 20", icon: ICONS.photos },
  { label: "Short film", hint: "≤ 15 seconds", icon: ICONS.film },
];

export function LetterEditor({ app }: { app: AppApi }) {
  const prompt = PROMPTS[app.template];
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <ScreenFrame collapsed={app.collapsed}>
      <div className="mx-auto grid max-w-[1080px] items-start gap-11 lg:grid-cols-[1fr_300px]">
        {/* writing surface */}
        <div className="animate-[sdRise_0.8s_both]">
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs text-app-dim">
              <span className="h-[7px] w-[7px] animate-[sdPulse_2s_infinite] rounded-full bg-[#5aa06a]" />
              Autosaved just now
            </span>
            <span className="text-xs uppercase tracking-[0.16em] text-app-faint">
              {app.capsuleType === "group" ? "Group draft" : "Solo draft"}
            </span>
          </div>

          <div className="rounded-lg border border-app-border bg-app-surface p-[clamp(28px,4vw,52px)] shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mb-1.5 font-serif text-[clamp(30px,4vw,46px)] font-medium italic">
              {app.template === "miss" ? "To — Someone I Miss" : "To — Future Me"}
            </div>
            <div className="mb-[26px] font-script text-[22px] text-app-dim">the {today}</div>

            <textarea
              value={app.letter}
              onChange={(ev) => app.setLetter(ev.target.value)}
              placeholder={prompt || "Start writing…"}
              rows={5}
              className="w-full resize-y border-none bg-transparent font-serif text-xl leading-[1.7] text-app-text outline-none"
            />

            {/* inline voice chip, within the paragraph flow */}
            <div className="my-3.5 flex w-fit max-w-full items-center gap-3.5 rounded-[40px] border border-app-border bg-app-accent-dim px-4 py-3">
              <button className="h-[34px] w-[34px] shrink-0 rounded-full bg-app-accent text-[13px] text-[#f6efe4]">▶</button>
              <Waveform active />
              <span className="text-[13px] tracking-[0.04em] text-app-dim">0:47</span>
            </div>

            <p className="mb-2 font-serif text-xl leading-[1.7] text-app-text">
              …I recorded the rain on the window so you&rsquo;d hear it too. Some things a photo can&rsquo;t hold.
            </p>

            <div className="my-[22px] mb-1.5 flex gap-3">
              {["#3a4a54", "#5a2e2e", "#3e463a"].map((c) => (
                <div key={c} className="h-[76px] w-[76px] overflow-hidden rounded border border-app-border">
                  <Photo tint={c} />
                </div>
              ))}
            </div>
            <Doodle className="!text-[19px] !text-app-dim">↑ three from that week</Doodle>
          </div>
        </div>

        {/* right rail — media + polaroid video */}
        <div className="flex animate-[sdRise_0.9s_0.1s_both] flex-col gap-[22px] lg:sticky lg:top-[30px]">
          <div className="rounded-[10px] border border-app-border bg-app-panel p-[18px] backdrop-blur-xl">
            <div className="mb-3.5 text-[10.5px] uppercase tracking-[0.2em] text-app-faint">Add to your letter</div>
            {MEDIA.map((r, i) => (
              <button key={r.label} className={`flex w-full items-center gap-3 py-3 text-left text-app-text ${i ? "border-t border-app-border" : ""}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-accent-dim text-app-accent">
                  <Icon d={r.icon} />
                </span>
                <span>
                  <span className="block text-sm">{r.label}</span>
                  <span className="block text-xs text-app-faint">{r.hint}</span>
                </span>
              </button>
            ))}
          </div>

          {/* polaroid video */}
          <div className="w-[230px] self-center rotate-[2.2deg] bg-[#efe6d3] p-[12px_12px_42px] shadow-[0_22px_50px_rgba(0,0,0,0.5)]">
            <div className="relative h-[200px] w-full overflow-hidden bg-[#2a2320]">
              <div className="absolute inset-0 animate-[sdZoom_20s_ease-in-out_infinite_alternate]">
                <Photo tint="#4a3a2e" sepia />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-[rgba(240,230,216,0.85)] text-[#f0e6d8]">▶</span>
              </div>
              <div className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] tracking-[0.14em] text-[#f0e6d8]">0:12</div>
            </div>
            <div className="mt-2 text-center font-script text-[22px] text-[#5a4636]">the last morning there</div>
          </div>

          <PrimaryButton onClick={() => app.go("delivery")} className="w-full justify-center">Set delivery</PrimaryButton>
        </div>
      </div>
    </ScreenFrame>
  );
}
