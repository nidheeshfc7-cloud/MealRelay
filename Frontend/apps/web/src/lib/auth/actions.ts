"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "./server";
import { safeNext } from "./config";
import { formatDefaultKitchenName } from "./kitchenName";

export type AuthResult = { ok: true; redirectTo: string; requiresEmailConfirmation?: boolean } | { ok: false; error: string; code: string };
const field = (form: FormData, key: string) => typeof form.get(key) === "string" ? String(form.get(key)) : "";
const failure = (code: string, error: string): AuthResult => ({ ok: false, code, error });

async function authenticate(form: FormData, signup: boolean): Promise<AuthResult> {
  const email = field(form, "email").trim();
  const password = field(form, "password");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < (signup ? 8 : 1) || password.length > 128)
    return failure("INVALID_INPUT", "Enter a valid email and password. New passwords need at least 8 characters.");
  try {
    const client = await createAuthClient();
    if (signup) {
      const site = process.env.AUTH_SITE_URL;
      if (!site) return failure("AUTH_NOT_CONFIGURED", "Authentication setup is incomplete.");
      const destination = new URL("/auth/callback", site);
      destination.searchParams.set("next", safeNext(field(form, "next")));
      const org = field(form, "organization").trim().slice(0, 120);
      const kitchen = field(form, "kitchenName").trim().slice(0, 120) || (org ? formatDefaultKitchenName(org) : "Your kitchen");
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: destination.toString(),
          data: {
            job_title: field(form, "jobTitle").trim().slice(0, 120),
            full_name: field(form, "fullName").trim().slice(0, 120),
            organization: org,
            kitchen_name: kitchen,
          },
        },
      });
      if (error) return failure("SIGNUP_FAILED", "Unable to create an account. Check your details or try signing in.");
      revalidatePath("/", "layout");
      return { ok: true, redirectTo: data.session ? "/dashboard" : "/login", requiresEmailConfirmation: !data.session };
    }
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) return error.code === "email_not_confirmed"
      ? failure("EMAIL_NOT_CONFIRMED", "Confirm your email once to activate this account, then sign in normally.")
      : failure("LOGIN_FAILED", "Unable to sign in. Check your email and password, then retry.");
    revalidatePath("/", "layout");
    return { ok: true, redirectTo: safeNext(field(form, "next")) };
  } catch (error) {
    return error instanceof Error && error.message === "AUTH_NOT_CONFIGURED"
      ? failure("AUTH_NOT_CONFIGURED", "Authentication setup is incomplete.")
      : failure("AUTH_UNAVAILABLE", "Authentication is temporarily unavailable. Please retry.");
  }
}

export async function signUp(form: FormData) { return authenticate(form, true); }
export async function signIn(form: FormData) { return authenticate(form, false); }
export async function signOut(scope: "local" | "global" = "local"): Promise<AuthResult> {
  if (scope !== "local" && scope !== "global") return failure("INVALID_SCOPE", "Choose a valid logout option.");
  try {
    const client = await createAuthClient();
    const { error } = await client.auth.signOut({ scope });
    if (error) return failure("LOGOUT_FAILED", "Unable to sign out. Please retry.");
    revalidatePath("/", "layout");
    return { ok: true, redirectTo: "/login" };
  } catch { return failure("AUTH_UNAVAILABLE", "Authentication is unavailable. Please retry."); }
}
