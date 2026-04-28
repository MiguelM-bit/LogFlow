export type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
};

export type ServerEnv = PublicEnv & {
  SUPABASE_SERVICE_ROLE_KEY: string;
};

export const PUBLIC_ENV_FALLBACKS: PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_KEY: "",
  NEXT_PUBLIC_APP_URL: "",
};

export function getFirstNonEmpty(...values: Array<string | undefined>): string {
  const first = values.find((value) => typeof value === "string" && value.trim().length > 0);
  return first ?? "";
}

export function isMissingEnv(value: string | undefined): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}