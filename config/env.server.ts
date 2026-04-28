import "server-only";
import { publicEnv } from "./env.public";
import type { ServerEnv } from "./env.shared";

if (typeof window !== "undefined") {
  throw new Error("[env:server] env.server.ts cannot be imported on the client side.");
}

function assertPublicEnvForServer() {
  const missing: string[] = [];

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_KEY.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `[env:server] Missing required public environment variables: ${missing.join(", ")}. ` +
        "Configure them in .env.local or Vercel Project Settings."
    );
  }
}

function getRequiredServerVar(key: "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      `[env:server] Missing required environment variable: ${key}. ` +
        "Configure it in .env.local or Vercel Project Settings."
    );
  }

  return value;
}

function resolveServerEnv(): ServerEnv {
  assertPublicEnvForServer();

  return {
    ...publicEnv,
    SUPABASE_SERVICE_ROLE_KEY: getRequiredServerVar("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export const serverEnv: ServerEnv = resolveServerEnv();
