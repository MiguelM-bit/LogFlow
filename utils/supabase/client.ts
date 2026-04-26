import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/config/env";

const env = getPublicEnv();

export const createClient = () =>
	createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_KEY);
