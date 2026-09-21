import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server-side Supabase client for Server Components, Route Handlers and
 * Server Actions. Wires Supabase's auth cookies through Next's cookie store.
 *
 * Next.js 15+ makes `cookies()` async, so this factory is async too — every
 * caller must `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` can be called from a Server Component, where setting
            // cookies is not allowed. This is safe to ignore when middleware
            // is responsible for refreshing sessions.
          }
        },
      },
    },
  );
}
