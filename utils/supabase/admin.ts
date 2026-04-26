import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/config/env";

const env = getServerEnv();

// Admin client must only be used in server contexts (API routes / server functions).
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
