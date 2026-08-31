// Footer — wordmark, nav, copyright.

export function Footer() {
  return (
    <footer className="bg-surface px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <a href="#hero" className="font-serif text-xl italic text-ink">
          Someday
        </a>
        <nav className="flex gap-8 text-[11px] tracking-[0.2em] text-ink/60">
          <a href="#how-it-works" className="transition-colors hover:text-ink">
            HOW IT WORKS
          </a>
          <a href="#examples" className="transition-colors hover:text-ink">
            PINBOARD
          </a>
          <a href="#together" className="transition-colors hover:text-ink">
            TOGETHER
          </a>
        </nav>
        <p className="text-[11px] text-ink/40">
          &copy; {new Date().getFullYear()} Someday
        </p>
      </div>
    </footer>
  );
}
