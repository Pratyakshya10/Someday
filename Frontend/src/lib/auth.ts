// Auth — backed by Supabase Auth (email + password).
//
// The signed-in user's id is a real Supabase Auth user id, and it's what we
// store in capsules.owner_id. `getUser()` validates the token with Supabase on
// each call, so the id can be trusted for authorization.

import { redirect } from "next/navigation";
import { createSupabaseServer } from "./supabase/server";

export interface CurrentUser {
  id: string;
  email: string | null;
}

/** The signed-in user (id + email), or null if there's no valid session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/** The signed-in user, or a redirect to sign-in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/app/signin");
  return user;
}

/** The signed-in user's id, or null if there's no valid session. */
export async function getOwnerId(): Promise<string | null> {
  return (await getCurrentUser())?.id ?? null;
}

/**
 * The signed-in user's id, or a redirect to sign-in if there isn't one.
 * Use this at the top of any page/action that needs a logged-in user.
 */
export async function requireOwnerId(): Promise<string> {
  const id = await getOwnerId();
  if (!id) redirect("/app/signin");
  return id;
}
