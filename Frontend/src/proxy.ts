// Proxy (formerly "middleware") — keeps the Supabase auth session fresh.
//
// On each matched request it reconstructs the session from cookies, asks
// Supabase to validate/refresh it, and writes any rotated cookies back onto the
// response. Without this, access tokens would silently expire.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Touch the user to trigger a refresh if the token is near expiry.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except static assets, image files, and the OAuth callback
  // (which manages its own session exchange).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
