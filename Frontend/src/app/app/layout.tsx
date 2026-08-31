import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppChrome } from "./components/AppChrome";

export const metadata: Metadata = {
  title: "Someday · App",
};

// Every /app/* page renders inside the themed shell (background + sidebar).
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppChrome>{children}</AppChrome>;
}
