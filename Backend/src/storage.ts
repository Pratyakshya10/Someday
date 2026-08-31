// Object storage for capsule media, backed by Supabase Storage.
//
// The bucket is PRIVATE. Uploads happen server-side with the service-role key
// (which bypasses row-level security), and reads are handed out as short-lived
// signed URLs — so a media file is only reachable by someone we've decided may
// see it. Nothing here trusts the browser.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = "capsule-media";

// How long a signed read URL stays valid. Long enough to load a page and play
// a clip; short enough that a leaked URL soon stops working.
const SIGNED_URL_TTL_SEC = 60 * 60; // 1 hour

let cached: SupabaseClient | null = null;

/** The admin storage client, created lazily so a missing key fails loudly. */
function admin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in your environment (see Backend/.env.example).",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/** Upload bytes to the media bucket at `path`. Overwrites if it already exists. */
export async function uploadObject(
  path: string,
  bytes: Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<void> {
  const body = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  const { error } = await admin()
    .storage.from(MEDIA_BUCKET)
    .upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}

/** A short-lived URL the browser can use to read a private object. */
export async function signedUrl(path: string, ttlSec = SIGNED_URL_TTL_SEC): Promise<string> {
  const { data, error } = await admin()
    .storage.from(MEDIA_BUCKET)
    .createSignedUrl(path, ttlSec);
  if (error) throw error;
  return data.signedUrl;
}

/** Remove an object. Safe to call even if it's already gone. */
export async function removeObject(path: string): Promise<void> {
  const { error } = await admin().storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}

/** Create the private media bucket if it doesn't exist yet (idempotent). */
export async function ensureBucket(): Promise<void> {
  const client = admin();
  const { data } = await client.storage.getBucket(MEDIA_BUCKET);
  if (data) return;
  const { error } = await client.storage.createBucket(MEDIA_BUCKET, { public: false });
  if (error && !/already exists/i.test(error.message)) throw error;
}
