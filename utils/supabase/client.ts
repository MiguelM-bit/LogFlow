import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/config/env.public";

export const createClient = () =>
	createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_KEY);
