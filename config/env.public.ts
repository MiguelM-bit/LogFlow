import { getFirstNonEmpty, isMissingEnv, PUBLIC_ENV_FALLBACKS, type PublicEnv } from "./env.shared";

function resolvePublicEnv(): PublicEnv {
  const missing: string[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (isMissingEnv(supabaseUrl)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  const supabaseKey = getFirstNonEmpty(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  if (isMissingEnv(supabaseKey)) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const appUrl = getFirstNonEmpty(process.env.NEXT_PUBLIC_APP_URL);

  if (missing.length > 0) {
    console.error(
      `[env:public] Missing environment variables: ${missing.join(", ")}. Using safe fallbacks on client.`
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ?? PUBLIC_ENV_FALLBACKS.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: supabaseKey ?? PUBLIC_ENV_FALLBACKS.NEXT_PUBLIC_SUPABASE_KEY,
    NEXT_PUBLIC_APP_URL: appUrl ?? PUBLIC_ENV_FALLBACKS.NEXT_PUBLIC_APP_URL,
  };
}

export const publicEnv: PublicEnv = resolvePublicEnv();
