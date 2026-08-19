// Hero — full-bleed framed photo, oversized editorial headline, script accent.

import Image from "next/image";

export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-screen frame-fade snap-start flex-col bg-canvas px-3 pb-3 pt-20 md:px-4"
    >
      <div className="relative flex-1 overflow-hidden rounded-sm">
        <Image
          src="/landing/hero.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover ken-burns"
        />
        {/* legibility overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/45 to-canvas/15" />

        {/* script annotations (doodles) */}
        <span className="float-slow absolute right-6 top-24 hidden -rotate-6 font-script text-2xl text-ink [text-shadow:0_2px_12px_rgba(0,0,0,0.8)] md:block lg:right-16">
          delivered on a date you choose ↝
        </span>
        <span
          style={{ animationDelay: "-3s" }}
          className="float-slow absolute bottom-24 right-10 hidden rotate-3 font-script text-2xl text-doodle-2 [text-shadow:0_2px_12px_rgba(0,0,0,0.85)] lg:block"
        >
          kept safe until then ✦
        </span>

        {/* content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-14">
          <p
            data-reveal
            className="mb-5 text-[13px] tracking-[0.35em] text-ink/75"
          >
            SOMEDAY · DIGITAL TIME CAPSULES
          </p>
          <h1
            data-reveal
            style={{ transitionDelay: "130ms" }}
            className="max-w-3xl font-serif text-4xl leading-[1.00] text-ink sm:text-6xl md:text-8xl"
          >
            Some things are meant to be{" "}
            <span className="italic">opened later.</span>
          </h1>
          <div
            data-reveal
            style={{ transitionDelay: "270ms" }}
            className="mt-40 flex flex-col gap-6 md:flex-row md:items-center"
          >
            <p className="max-w-sm text-sm text-ink/85">
              Seal a letter with your voice, your photographs, a thirty-second
              film and choose the day it finds you again.
            </p>
            <a
              href="/capsule/new"
              className="group inline-flex w-fit items-center gap-3 bg-accent px-7 py-3.5 text-[11px] tracking-[0.2em] text-ink transition-colors hover:bg-accent-strong"
            >
              SEAL YOUR FIRST CAPSULE
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
