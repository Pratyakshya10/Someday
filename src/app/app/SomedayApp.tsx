"use client";
// The app shell: owns shared state, wires the prototype controls, and swaps the
// active screen. Each screen lives in ./screens/*, the sidebar in ./components.
import { useEffect, useState, type ReactNode } from "react";
import type {
  AppApi, ScreenKey, ThemeKey, CapsuleType, UnlockType, CapsuleState, SampleData, TemplateKey,
} from "./types";
import { Grain, Vignette } from "./components/ui";
import { Sidebar } from "./components/Sidebar";
import { SignIn } from "./screens/SignIn";
import { NewCapsule } from "./screens/NewCapsule";
import { LetterEditor } from "./screens/LetterEditor";
import { SetDelivery } from "./screens/SetDelivery";
import { Sealing } from "./screens/Sealing";
import { Vault } from "./screens/Vault";
import { UnlockReveal } from "./screens/UnlockReveal";

export default function SomedayApp() {
  const [mounted, setMounted] = useState(false);

  const [screen, setScreen] = useState<ScreenKey>("auth");
  const [theme, setTheme] = useState<ThemeKey>("noir");
  const [collapsed, setCollapsed] = useState(false);

  const [capsuleType, setCapsuleType] = useState<CapsuleType>("solo");
  const [predictions, setPredictions] = useState(true);
  const [unlockType, setUnlockType] = useState<UnlockType>("date");
  const [capsuleState, setCapsuleState] = useState<CapsuleState>("sealed");
  const [sampleData, setSampleData] = useState<SampleData>("many");

  const [template, setTemplate] = useState<TemplateKey>("future");
  const [letter, setLetter] = useState("");

  useEffect(() => setMounted(true), []);

  const go = (next: ScreenKey) => {
    setScreen(next);
    window.scrollTo(0, 0);
  };

  const app: AppApi = {
    screen, go, theme, setTheme, collapsed, setCollapsed,
    capsuleType, setCapsuleType, predictions, setPredictions,
    unlockType, setUnlockType, capsuleState, setCapsuleState,
    sampleData, setSampleData, template, setTemplate, letter, setLetter,
  };

  // Render nothing time-dependent until mounted, so SSR and hydration agree.
  if (!mounted) {
    return <div data-app-theme={theme} className="min-h-screen bg-app-bg" />;
  }

  const screens: Record<ScreenKey, ReactNode> = {
    auth: <SignIn app={app} />,
    new: <NewCapsule app={app} />,
    editor: <LetterEditor app={app} />,
    delivery: <SetDelivery app={app} />,
    sealing: <Sealing app={app} />,
    vault: <Vault app={app} />,
    reveal: <UnlockReveal app={app} />,
  };

  return (
    <div data-app-theme={theme} className="relative min-h-screen bg-gradient-to-b from-app-bg to-app-bg2 font-sans text-app-text">
      <Grain />
      <Vignette />
      <Sidebar app={app} />
      {screens[screen]}
    </div>
  );
}
