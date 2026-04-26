import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/config/env";

const env = getPublicEnv();

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>
) => {
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_KEY, {
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
