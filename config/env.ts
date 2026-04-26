type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_KEY: string;
  NEXT_PUBLIC_APP_URL?: string;
};

type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
};

const REQUIRED_PUBLIC_KEYS = ["NEXT_PUBLIC_SUPABASE_URL"] as const;

function assertRequired(keys: readonly string[], scope: "public" | "server") {
  const missing = keys.filter((key) => !process.env[key] || process.env[key]?.trim() === "");

  if (missing.length > 0) {
    throw new Error(
      `[env:${scope}] Missing required environment variables: ${missing.join(", ")}. ` +
        "Configure them in your environment (e.g. .env.local or Vercel Project Settings)."
    );
  }
}

export function getPublicEnv(): PublicEnv {
  assertRequired(REQUIRED_PUBLIC_KEYS, "public");

  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!publicKey || publicKey.trim() === "") {
    throw new Error(
      "[env:public] Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    NEXT_PUBLIC_SUPABASE_KEY: publicKey,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("[env:server] getServerEnv() cannot be called on the client side.");
  }

  assertRequired(
    [
      ...REQUIRED_PUBLIC_KEYS,
      "SUPABASE_SERVICE_ROLE_KEY",
    ],
    "server"
  );

  const pub = getPublicEnv();

  return {
    ...pub,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
}
