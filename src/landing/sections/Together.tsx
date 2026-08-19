// Together — "Some memories belong to everyone." Full-bleed imagery with
// scattered script annotations; content sits on the left.

import Image from "next/image";

export function Together() {
  return (
    <section
      id="together"
      className="relative flex min-h-screen frame-fade snap-start items-center overflow-hidden px-6 py-20 md:px-10"
    >
      <Image
        src="/landing/group.jpeg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover ken-burns"
      />
      <div className="absolute inset-0 bg-canvas/60" />

      {/* script annotations */}
      <span className="float-slow absolute right-[16%] top-[24%] hidden rotate-3 font-script text-xl text-doodle md:block">
        ↝ everyone drops in a note
      </span>
      <span
        style={{ animationDelay: "-2s" }}
        className="float-slow absolute right-[10%] top-[46%] hidden -rotate-2 font-script text-xl text-doodle-2 md:block"
      >
        voice memos from the whole crew ↓
      </span>
      <span
        style={{ animationDelay: "-4s" }}
        className="float-slow absolute right-[20%] top-[64%] hidden rotate-2 font-script text-xl text-accent md:block"
      >
        it opens for all of you at once ✳
      </span>

      {/* content */}
      <div className="relative z-10 max-w-xl">
        <div data-reveal className="flex items-center gap-4">
          <span className="h-px w-10 bg-accent" />
          <p className="text-[11px] tracking-[0.35em] text-ink/75">
            GROUP CAPSULES
          </p>
        </div>
        <h2
          data-reveal
          style={{ transitionDelay: "130ms" }}
          className="mt-5 font-serif text-4xl leading-[0.98] text-ink md:text-7xl"
        >
          Some memories belong to <span className="italic">everyone.</span>
        </h2>
        <p
          data-reveal
          style={{ transitionDelay: "250ms" }}
          className="mt-6 max-w-md text-sm text-ink/85"
        >
          Start a shared capsule and pass it around. Everyone adds their own
          note, their own voice, their own photo, then it unlocks for all of
          you on the same day.
        </p>
        <a
          data-reveal
          style={{ transitionDelay: "370ms" }}
          href="/capsule/new?type=group"
          className="group mt-8 inline-flex items-center gap-3 border border-ink/40 px-7 py-3.5 text-[11px] tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-canvas"
        >
          START A SHARED CAPSULE
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </a>
      </div>
    </section>
  );
}
