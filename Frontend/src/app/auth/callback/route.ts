// OAuth callback — where Supabase (Google, etc.) sends the browser back after
// the provider's consent screen. Exchanges the one-time `code` for a session
// (setting the auth cookies via createSupabaseServer), then continues on to
// wherever signInWithGoogleAction asked for via `next`.

import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app/vault";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/app/signin?error=google", url.origin));
}
