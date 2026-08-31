// One-time setup: create the private "capsule-media" bucket in Supabase Storage.
//
// Run after you've put SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in Backend/.env:
//   node --env-file=.env scripts/setup-storage.mjs
// (from the Backend/ directory). Safe to run more than once.

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const BUCKET = "capsule-media";
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: existing } = await supabase.storage.getBucket(BUCKET);
if (existing) {
  console.log(`Bucket "${BUCKET}" already exists — nothing to do.`);
  process.exit(0);
}

const { error } = await supabase.storage.createBucket(BUCKET, {
  public: false,
  fileSizeLimit: "50MB",
});

if (error) {
  console.error("Failed to create bucket:", error.message);
  process.exit(1);
}

console.log(`Created private bucket "${BUCKET}". Media uploads are ready.`);
