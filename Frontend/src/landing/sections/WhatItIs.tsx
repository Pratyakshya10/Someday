// WhatItIs — "A letter you can't open yet." Three columns: a sealed paper note,
// a polaroid + copy, and a voice note + short film.
// IMAGE SLOT: the polaroid photo. (Video thumbnail is left as a placeholder.)
import Image from "next/image";

function PlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`fill-current ${className}`} aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

const waveform = [
  8, 14, 20, 11, 24, 30, 18, 9, 16, 26, 32, 22, 12, 7, 19, 28, 15, 10, 23, 13,
  17, 25, 9, 14,
];

export function WhatItIs() {
  return (
    <section
      id="how-it-works"
      className="flex min-h-screen frame-fade snap-start items-center bg-canvas px-6 pb-14 pt-28 md:px-10"
    >
      <div className="mx-auto w-full max-w-7xl">
        <div data-reveal className="relative mb-10">
          <p className="pl-1 text-[11px] tracking-[0.35em] text-ink/60">
            WHAT IT IS
          </p>
          <h2 className="mt-2 font-serif text-4xl leading-[1.05] text-ink md:text-6xl">
            A letter you <span className="italic">can&apos;t</span> open yet.
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Column 1 — sealed note */}
          <div data-reveal style={{ transitionDelay: "120ms" }}>
            <div className="relative -rotate-1 bg-paper p-6 text-paper-ink shadow-2xl">
              <span className="absolute -top-3 left-8 h-6 w-20 -rotate-3 bg-paper-ink/10" />
              <div className="flex justify-between text-[10px] tracking-[0.2em] text-paper-ink/60">
                <span>TO — FUTURE ME</span>
                <span>SEALED</span>
              </div>
              <hr className="my-3 border-paper-ink/15" />
              <p className="font-serif text-base leading-relaxed">
                &ldquo;By the time you read this, I hope the thing you&rsquo;re
                worried about tonight turned out to be nothing.&rdquo;
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-serif italic text-sm text-paper-ink/70">
                  — you, this year
                </span>
                <span className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  LOCKED
                </span>
              </div>
            </div>
            <p className="mt-4 font-script text-lg text-doodle">
              ↖ write it once, seal it for good
            </p>
            {/* Second short film, tilted, filling the space below the note.
                VIDEO SLOT: /landing/somedayvid2.mp4 */}
            <div className="relative mt-6 aspect-video rotate-2 overflow-hidden rounded-lg border border-glass-border bg-gradient-to-br from-canvas to-surface shadow-2xl">
              <video
                src="/landing/somedayvid2.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-3 text-xs text-ink/85">
                the last evening
              </span>
            </div>
          </div>

          {/* Column 2 — polaroid + copy */}
          <div data-reveal style={{ transitionDelay: "240ms" }}>
            <div className="relative mx-auto max-w-[300px] rotate-2 bg-paper p-3 pb-8 shadow-2xl">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src="/landing/summer.jpeg"
                  alt="summer, before everything changed"
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 text-center font-script text-lg text-paper-ink/80">
                summer, before everything changed
              </p>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink/85">
              Write to your future self, or to the people you love. Add a voice
              note, a handful of photographs, a short film. Then lock it and
              set the day it comes back.
            </p>
          </div>

          {/* Column 3 — voice note + film */}
          <div data-reveal style={{ transitionDelay: "360ms" }} className="space-y-5">
            <p className="-mb-1 -rotate-2 font-script text-lg text-doodle-2">
              press play, it&rsquo;s really you ↓
            </p>
            <div className="rounded-lg border border-glass-border bg-glass backdrop-blur-md p-5">
              <div className="flex justify-between text-[10px] tracking-[0.2em] text-ink/60">
                <span>VOICE NOTE</span>
                <span>0:47</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent">
                  <PlayIcon className="h-4 w-4 translate-x-[1px] text-ink" />
                </span>
                <div className="flex h-7 flex-1 items-center gap-[3px]">
                  {waveform.map((h, i) => (
                    <span
                      key={i}
                      className="w-full rounded-full bg-ink/50"
                      style={{ height: `${h * 0.85}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Short film on the right. VIDEO SLOT: /landing/somedayvid1.mp4 */}
            <div className="relative aspect-video overflow-hidden rounded-lg border border-glass-border bg-gradient-to-br from-surface to-canvas shadow-xl">
              <video
                src="/landing/somedayvid1.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-3 text-xs text-ink/85">
                30 seconds, unedited
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
