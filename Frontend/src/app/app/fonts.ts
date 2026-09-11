// The curated set of fonts a letter can be written in. Each maps to a CSS
// variable defined by next/font in the root layout (self-hosted Google Fonts —
// no runtime request, no layout shift). The slug is what rides in the body's
// `[[font:slug]]` token; "default" writes no token.

export interface LetterFont {
  slug: string;
  label: string;
  /** A CSS font-family value, wired to a next/font variable. */
  css: string;
}

export const LETTER_FONTS: LetterFont[] = [
  { slug: "default", label: "Classic", css: "var(--font-serif)" },
  { slug: "elegant", label: "Elegant", css: "var(--font-cormorant), Georgia, serif" },
  { slug: "script", label: "Handwritten", css: "var(--font-script)" },
  { slug: "flowing", label: "Flowing", css: "var(--font-dancing), cursive" },
  { slug: "typewriter", label: "Typewriter", css: "var(--font-special-elite), 'Courier New', monospace" },
  { slug: "clean", label: "Clean", css: "var(--font-sans)" },
];

/** The CSS font-family for a slug, falling back to the classic serif. */
export function fontCss(slug: string | null): string {
  return LETTER_FONTS.find((f) => f.slug === slug)?.css ?? LETTER_FONTS[0].css;
}

// The letter's text size, same rides-in-the-body mechanism as the font (a
// `[[size:slug]]` token — see letter.ts's parseSize/withSize). "default"
// matches the size the editor and reveal used before this was adjustable.
export interface LetterSize {
  slug: string;
  label: string;
  /** Pixel font-size, applied inline (line-height stays the unitless 1.65
   *  already on the letter text, so it scales with whatever size this is). */
  px: number;
}

export const LETTER_SIZES: LetterSize[] = [
  { slug: "small", label: "Small", px: 15 },
  { slug: "default", label: "Default", px: 18 },
  { slug: "large", label: "Large", px: 22 },
  { slug: "xlarge", label: "Extra large", px: 27 },
];

/** The pixel size for a slug, falling back to the default. */
export function fontSizePx(slug: string | null): number {
  return LETTER_SIZES.find((s) => s.slug === slug)?.px ?? LETTER_SIZES.find((s) => s.slug === "default")!.px;
}
