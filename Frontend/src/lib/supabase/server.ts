// A Supabase client bound to the current request's cookies, for use in Server
// Components, Server Actions, and Route Handlers. It reads and (where allowed)
// writes the auth session cookies so sign-in state survives across requests.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component where cookies can't be set — the
          // proxy refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}
