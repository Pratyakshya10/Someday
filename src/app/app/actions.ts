"use server";
// Server Actions — the only way the browser is allowed to change data.
//
// Each one re-checks who's signed in (never trust an id sent from the client),
// does the smallest possible mutation through the backend data layer, then
// either returns a tiny result or redirects. They're imported by Client
// Components and invoked on click / form submit.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  createDraft,
  saveDraft,
  setDeliveryDate,
  setDeliveryLocation,
  setDeliveryMilestone,
  sealCapsule,
  openByLocation,
  openByMilestone,
  getCapsule,
  saveContribution,
  createLinkInvite,
  createEmailInvite,
  revokeInvite,
  setMemberRole,
  removeMember,
} from "@someday/backend";
import { requireOwnerId, requireUser } from "@/lib/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_RECIPIENT } from "./data";
import type { CapsuleType, MemberRole, TemplateKey } from "./types";

/** Owner-only guard: returns the capsule if the caller owns it, else throws. */
async function assertOwner(capsuleId: string): Promise<string> {
  const ownerId = await requireOwnerId();
  const capsule = await getCapsule(capsuleId, ownerId);
  if (!capsule) throw new Error("Not authorized");
  return ownerId;
}

export type AuthState = { error?: string; notice?: string };

/**
 * Sign up or log in with email + password (chosen by the form's `mode` field).
 * Returns an error/notice to show; on success it redirects into the vault.
 * Shaped for React's useActionState (prevState, formData).
 */
export async function authAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter your email and password." };
  if (mode === "signup" && password.length < 6) return { error: "Use a password of at least 6 characters." };

  const supabase = await createSupabaseServer();

  if (mode === "signup") {
    // Create the account already-confirmed (no verification email) so the
    // person is logged straight in. `email_confirm: true` marks it confirmed.
    const admin = createSupabaseAdmin();
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        return { error: "That email already has an account — log in instead." };
      }
      return { error: error.message };
    }
  }

  // Establish the session (works for a fresh signup too, since it's confirmed).
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect("/app/vault");
}

/** Begin Google sign-in — redirects to Google's consent screen. Requires the
 *  Google provider to be enabled in the Supabase dashboard. */
export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=/app/vault` },
  });
  if (error || !data?.url) redirect("/app/signin?error=google");
  redirect(data.url);
}

/** Sign out and return to the sign-in screen. */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/app/signin");
}

/** Create a fresh draft from the chosen type + template, then open its editor. */
export async function createDraftAction(input: {
  type: CapsuleType;
  template: TemplateKey;
}): Promise<void> {
  const ownerId = await requireOwnerId();
  const capsule = await createDraft(ownerId, {
    type: input.type,
    template: input.template,
    recipient: DEFAULT_RECIPIENT[input.template] || null,
  });
  redirect(`/app/capsule/${capsule.id}/editor`);
}

/** Autosave the letter as it's written. Returns whether the save stuck. */
export async function saveDraftAction(
  id: string,
  edits: { recipient?: string; title?: string; body?: string },
): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const updated = await saveDraft(id, ownerId, edits);
  return { ok: updated !== null };
}

/** Set the delivery date on a draft. `isoDate` is a plain YYYY-MM-DD string. */
export async function setDeliveryAction(
  id: string,
  isoDate: string,
): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  // Interpret the chosen day as local midnight.
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { ok: false };
  const updated = await setDeliveryDate(id, ownerId, date);
  return { ok: updated !== null };
}

/** Set a place-based unlock on a draft. */
export async function setLocationAction(
  id: string,
  place: { lat: number; lng: number; radiusM: number; label?: string },
): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng) || !Number.isFinite(place.radiusM)) {
    return { ok: false };
  }
  const updated = await setDeliveryLocation(id, ownerId, {
    lat: place.lat,
    lng: place.lng,
    radiusM: Math.round(place.radiusM),
    label: place.label?.trim() || null,
  });
  return { ok: updated !== null };
}

/** Set a milestone-based unlock on a draft. */
export async function setMilestoneAction(id: string, milestone: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const text = milestone.trim();
  if (!text) return { ok: false };
  const updated = await setDeliveryMilestone(id, ownerId, text);
  return { ok: updated !== null };
}

/** Try to open a location capsule from the reader's current coordinates. */
export async function openByLocationAction(
  id: string,
  lat: number,
  lng: number,
): Promise<{ ok: boolean; reason?: string; distanceM?: number }> {
  const ownerId = await requireOwnerId();
  const res = await openByLocation(id, ownerId, lat, lng);
  if (res.ok) {
    revalidatePath(`/app/capsule/${id}`);
    return { ok: true };
  }
  return { ok: false, reason: res.reason, distanceM: res.distanceM };
}

/** Open a milestone capsule — the reader attests the event happened. */
export async function openByMilestoneAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const opened = await openByMilestone(id, ownerId);
  const ok = opened?.status === "unlocked";
  if (ok) revalidatePath(`/app/capsule/${id}`);
  return { ok };
}

/** Seal a draft shut. Returns whether it sealed (needs an unlock set first). */
export async function sealAction(id: string): Promise<{ ok: boolean }> {
  const ownerId = await requireOwnerId();
  const sealed = await sealCapsule(id, ownerId);
  if (sealed) revalidatePath("/app/vault");
  return { ok: sealed !== null };
}

// ── Group capsules ──────────────────────────────────────────

/** Save the signed-in member's own note on a group capsule. */
export async function saveContributionAction(capsuleId: string, body: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const ok = await saveContribution(capsuleId, user.id, body);
  return { ok };
}

/** Create/reuse the shareable link invite; returns its token (owner only). */
export async function createLinkInviteAction(
  capsuleId: string,
  role: MemberRole,
): Promise<{ ok: boolean; token?: string }> {
  await assertOwner(capsuleId);
  const invite = await createLinkInvite(capsuleId, role === "viewer" ? "viewer" : "editor");
  revalidatePath(`/app/capsule/${capsuleId}/editor`);
  return { ok: true, token: invite.token };
}

/** Invite a specific email at view/edit access (owner only). */
export async function inviteEmailAction(
  capsuleId: string,
  email: string,
  role: MemberRole,
): Promise<{ ok: boolean; error?: string }> {
  await assertOwner(capsuleId);
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { ok: false, error: "Enter a valid email." };
  await createEmailInvite(capsuleId, clean, role === "viewer" ? "viewer" : "editor");
  revalidatePath(`/app/capsule/${capsuleId}/editor`);
  return { ok: true };
}

/** Revoke a pending invite (owner only). */
export async function revokeInviteAction(capsuleId: string, inviteId: string): Promise<{ ok: boolean }> {
  await assertOwner(capsuleId);
  await revokeInvite(inviteId, capsuleId);
  revalidatePath(`/app/capsule/${capsuleId}/editor`);
  return { ok: true };
}

/** Change a member's role (owner only; can't touch the owner). */
export async function setMemberRoleAction(
  capsuleId: string,
  userId: string,
  role: MemberRole,
): Promise<{ ok: boolean }> {
  await assertOwner(capsuleId);
  await setMemberRole(capsuleId, userId, role === "viewer" ? "viewer" : "editor");
  revalidatePath(`/app/capsule/${capsuleId}/editor`);
  return { ok: true };
}

/** Remove a member (owner only). */
export async function removeMemberAction(capsuleId: string, userId: string): Promise<{ ok: boolean }> {
  await assertOwner(capsuleId);
  await removeMember(capsuleId, userId);
  revalidatePath(`/app/capsule/${capsuleId}/editor`);
  return { ok: true };
}
