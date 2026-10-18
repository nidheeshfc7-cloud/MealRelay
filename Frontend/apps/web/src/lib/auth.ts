import { signIn, signUp, signOut } from "./auth/actions";

export interface UserSession { id: string; email: string; fullName?: string; role?: string; institution?: string; }
export interface LoginCredentials { email: string; password: string; rememberMe?: boolean; next?: string; }
export interface SignupCredentials { fullName: string; email: string; password: string; organization?: string; role?: string; }
export interface AuthResult { success: boolean; user?: UserSession; error?: string; pendingIntegration?: boolean; requiresEmailConfirmation?: boolean; redirectTo?: string; }
export const AUTH_CONFIG = { isIntegrationPending: !(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) };

function credentialsForm(credentials: LoginCredentials) {
  const form = new FormData();
  form.set("email", credentials.email);
  form.set("password", credentials.password);
  if (credentials.next) form.set("next", credentials.next);
  return form;
}
export async function loginWithCredentials(credentials: LoginCredentials): Promise<AuthResult> {
  const result = await signIn(credentialsForm(credentials));
  return result.ok ? { success: true, redirectTo: result.redirectTo } : { success: false, error: result.error, pendingIntegration: result.code === "AUTH_NOT_CONFIGURED" };
}
export async function signupWithCredentials(credentials: SignupCredentials): Promise<AuthResult> {
  const form = credentialsForm(credentials);
  form.set("fullName", credentials.fullName);
  form.set("organization", credentials.organization || "");
  const result = await signUp(form);
  if (!result.ok) return { success: false, error: result.error, pendingIntegration: result.code === "AUTH_NOT_CONFIGURED" };
  if (result.requiresEmailConfirmation) return { success: false, requiresEmailConfirmation: true, error: "Check your email to confirm your account, then sign in." };
  return { success: true, redirectTo: result.redirectTo };
}
// Legacy synchronous accessor cannot securely verify HTTP-only cookies.
// Use getCurrentUser() on the server; never trust localStorage as identity.
export function getStoredSession(): UserSession | null { return null; }
export async function clearStoredSession(): Promise<void> {
  const result = await signOut();
  if (!result.ok) throw new Error(result.error);
  if (typeof window !== "undefined") localStorage.removeItem("mealrelay_auth_session");
}
