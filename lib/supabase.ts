import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/config/env";

const env = getPublicEnv();

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_KEY
);
