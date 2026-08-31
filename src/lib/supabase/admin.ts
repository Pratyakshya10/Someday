// Server-only Supabase admin client (service-role key). Used to create
// already-confirmed accounts so email + password sign-up logs the person in
// immediately, with no confirmation email. Never import this into client code.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function createSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not configured.");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
