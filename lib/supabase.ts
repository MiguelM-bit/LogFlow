import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/config/env.public";

function createSupabaseClient() {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_KEY);
}

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  },
});
