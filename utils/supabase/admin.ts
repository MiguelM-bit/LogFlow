import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/config/env.server";

// Admin client must only be used in server contexts (API routes / server functions).
export const supabaseAdmin = createClient(
  serverEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
