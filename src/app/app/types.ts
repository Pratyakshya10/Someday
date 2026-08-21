// Shared types for the Someday app prototype.

export type ScreenKey =
  | "auth"
  | "new"
  | "editor"
  | "delivery"
  | "sealing"
  | "vault"
  | "reveal";

export type ThemeKey = "noir" | "slate" | "black" | "crimson" | "glass";
export type CapsuleType = "solo" | "group";
export type UnlockType = "date" | "location" | "milestone";
export type CapsuleState = "draft" | "sealed" | "unlocked";
export type SampleData = "empty" | "one" | "many";
export type TemplateKey = "future" | "miss" | "predict" | "confess" | "blank";

// The single object of state + setters passed down to the sidebar and screens.
export interface AppApi {
  screen: ScreenKey;
  go: (screen: ScreenKey) => void;

  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;

  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;

  capsuleType: CapsuleType;
  setCapsuleType: (v: CapsuleType) => void;
  predictions: boolean;
  setPredictions: (v: boolean) => void;
  unlockType: UnlockType;
  setUnlockType: (v: UnlockType) => void;
  capsuleState: CapsuleState;
  setCapsuleState: (v: CapsuleState) => void;
  sampleData: SampleData;
  setSampleData: (v: SampleData) => void;

  template: TemplateKey;
  setTemplate: (v: TemplateKey) => void;
  letter: string;
  setLetter: (v: string) => void;
}
