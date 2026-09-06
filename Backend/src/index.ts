// @someday/backend — the public surface of the backend package.
// Anything exported here is importable from the frontend as:
//   import { db } from "@someday/backend";

export { db } from "./prisma";

// The capsule data layer — the app's real read/write surface.
export {
  listCapsules,
  listUserCapsules,
  getCapsule,
  getAccessibleCapsule,
  createDraft,
  saveDraft,
  setDeliveryDate,
  setDeliveryLocation,
  setDeliveryMilestone,
  sealCapsule,
  openCapsule,
  openIfDue,
  openByLocation,
  openByMilestone,
  type Capsule,
  type DraftEdits,
  type LocationOpenResult,
} from "./capsules";

// Media: the attachment data layer + object storage.
export {
  addAttachment,
  listAttachments,
  listCapsuleAttachments,
  getAttachment,
  deleteAttachment,
  type Attachment,
  type NewAttachment,
} from "./attachments";

// Group capsules: members, invites, and per-member notes.
export {
  getMemberRole,
  canEditRole,
  listMembers,
  upsertMember,
  removeMember,
  setMemberRole,
  createLinkInvite,
  createEmailInvite,
  listInvites,
  getInviteByToken,
  revokeInvite,
  acceptInvite,
  resolveEmailInvites,
  getOrCreateContribution,
  listContributions,
  saveContribution,
  type CapsuleMember,
  type CapsuleInvite,
  type Contribution,
  type MemberRole,
} from "./groups";

export { getUserEmail, getUserEmails } from "./admin";

// Contacts — people a user can schedule messages to.
export {
  listContacts,
  getContact,
  addContact,
  deleteContact,
  type Contact,
} from "./contacts";

// Scheduled messages — letters addressed to a contact, delivered by email.
export {
  createScheduledDraft,
  getScheduled,
  getScheduledByCapsule,
  listScheduled,
  scheduleMessage,
  unscheduleMessage,
  deleteScheduled,
  type ScheduledMessage,
  type ScheduledWithRelations,
} from "./scheduled";

export {
  MEDIA_BUCKET,
  uploadObject,
  signedUrl,
  removeObject,
  ensureBucket,
} from "./storage";
