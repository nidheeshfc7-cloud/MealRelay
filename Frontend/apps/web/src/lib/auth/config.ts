export function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("AUTH_NOT_CONFIGURED");
  return { url, key };
}

export function safeNext(value: unknown) {
  return typeof value === "string" && /^\/(dashboard|forecasts|planner|analytics|settings|onboarding)(?:[/?]|$)/.test(value) && !value.includes("\\")
    ? value : "/dashboard";
}
