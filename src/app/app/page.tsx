import type { Metadata } from "next";
import SomedayApp from "./SomedayApp";

export const metadata: Metadata = {
  title: "Someday · App",
};

export default function AppPage() {
  return <SomedayApp />;
}
