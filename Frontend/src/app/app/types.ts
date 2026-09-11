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
  caption: string | null;
  url: string;
}

// A journal entry's own media — same shape as AttachmentView, kept as a
// separate type since it backs a separate table (JournalAttachment).
export interface JournalAttachmentView {
  id: string;
  kind: AttachmentKind;
  mimeType: string;
  sizeBytes: number;
  durationSec: number | null;
  caption: string | null;
  url: string;
}

// One day's private journal entry, as it crosses to the client.
export interface JournalEntryView {
  id: string;
  entryDate: string; // "YYYY-MM-DD"
  body: string;
  mood: string | null;
  attachments: JournalAttachmentView[];
  createdAt: string;
  updatedAt: string;
}

// A past entry resurfaced because today shares its calendar day.
export interface OnThisDayView {
  entry: JournalEntryView;
  yearsAgo: number;
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

// A saved contact — someone you can schedule a message to.
export interface ContactView {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

export type ScheduledStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "canceled";

// A scheduled message as it crosses to the client: the delivery lifecycle plus
// the recipient and the backing capsule that holds its words + media.
export interface ScheduledView {
  id: string;
  status: ScheduledStatus;
  sendAt: string | null;
  occasion: string | null;
  sentAt: string | null;
  createdAt: string;
  contact: ContactView | null;
  capsule: CapsuleView;
}

// The chrome (sidebar collapse) shared by every /app page, provided via context.
export interface ChromeApi {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  /** Whether the sidebar drawer is open on a small screen (below md). Desktop
   *  ignores this — the sidebar is always visible there. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}
