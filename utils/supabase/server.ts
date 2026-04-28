import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/config/env.public";

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // This can happen when called in a Server Component.
          // Middleware should handle session refresh and cookie updates.
        }
      },
    },
  });
};
