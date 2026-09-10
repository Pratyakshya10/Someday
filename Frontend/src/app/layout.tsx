import type { Metadata } from "next";
import { Playfair_Display, Work_Sans, Caveat, Cormorant_Garamond, Dancing_Script, Special_Elite, Betania_Patmos, Square_Peg } from "next/font/google";
import "./globals.css";

const serif = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

const sans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const script = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600"],
});

// Extra letter fonts for the writing surface's font picker.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  subsets: ["latin"],
  weight: ["400"],
});

// The Someday wordmark.
const betaniaPatmos = Betania_Patmos({
  variable: "--font-betania-patmos-raw",
  subsets: ["latin"],
  weight: ["400"],
});

// Cursive/curly headings and doodles throughout the app and landing page.
const squarePeg = Square_Peg({
  variable: "--font-square-peg-raw",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Someday",
  description:
    "A digital time capsule. Seal a letter — with your voice, your photographs, a thirty-second film — and choose the day it finds you again.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${script.variable} ${cormorant.variable} ${dancing.variable} ${specialElite.variable} ${betaniaPatmos.variable} ${squarePeg.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
