// Shared types for the Someday app.

export type CapsuleType = "solo" | "group";
export type UnlockType = "date" | "location" | "milestone";
export type CapsuleStatus = "draft" | "sealed" | "unlocked";
export type TemplateKey = "future" | "miss" | "predict" | "confess" | "blank";
export type AttachmentKind = "voice" | "photo" | "video";

// One media item as it crosses to the client — `url` is a short-lived signed
// URL the browser can load directly.
export interface AttachmentView {
  id: string;
  kind: AttachmentKind;
  mimeType: string;
  sizeBytes: number;
  durationSec: number | null;
  url: string;
}

// A capsule as it crosses from the server into a Client Component. Dates are
// serialized to ISO strings (or null) because plain objects — not Date
// instances — are what can be passed across that boundary.
export interface CapsuleView {
  id: string;
  type: CapsuleType;
  status: CapsuleStatus;
  unlockType: UnlockType;
  unlockDate: string | null;
  unlockLat: number | null;
  unlockLng: number | null;
  unlockRadiusM: number | null;
  unlockPlaceLabel: string | null;
  unlockMilestone: string | null;
  template: string | null;
  recipient: string | null;
  title: string | null;
  body: string | null;
  sealedAt: string | null;
  unlockedAt: string | null;
  createdAt: string;
}

export type MemberRole = "owner" | "editor" | "viewer";

export interface MemberView {
  userId: string;
  email: string | null;
  role: MemberRole;
  isYou: boolean;
}

export interface InviteView {
  id: string;
  email: string | null;
  role: MemberRole;
  token: string;
  accepted: boolean;
}

// One member's note in a group capsule, with their media, for the reveal.
export interface ContributionView {
  authorId: string;
  authorEmail: string | null;
  body: string;
  attachments: AttachmentView[];
  isYou: boolean;
}

// The chrome (sidebar collapse) shared by every /app page, provided via context.
export interface ChromeApi {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}
