// Server-only Supabase admin client (service-role key). Used for the few
// things the app needs about *other* users — e.g. showing a group member's
// email next to their note. Never expose this client to the browser.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function admin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured.");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/** The email for a Supabase user id, or null if unknown. */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data } = await admin().auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Emails for many user ids at once (small groups — one lookup each). */
export async function getUserEmails(userIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  await Promise.all(
    [...new Set(userIds)].map(async (id) => {
      const email = await getUserEmail(id);
      if (email) out.set(id, email);
    }),
  );
  return out;
}
