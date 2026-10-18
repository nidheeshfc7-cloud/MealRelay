# Authentication integration

Supabase Auth owns password storage. No custom password database is used. Provider credentials are currently absent; real signup, login, logout and session refresh have NOT been verified.

## Configuration

Copy `.env.example` to `.env.local` in `Frontend/apps/web`. Set:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: public publishable key (legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also supported).
- `AUTH_SITE_URL`: canonical full application origin, e.g. `http://localhost:3000` or your HTTPS deployment URL.

Never use a service-role/secret key. Restart Next.js after changing variables. Enable Email/password auth in Supabase, set its Site URL, allow `<AUTH_SITE_URL>/auth/callback` in Redirect URLs, and configure SMTP for production. Keep email confirmation enabled. Configure provider password policies and rate limits; CAPTCHA can be added before public launch.

For confirmations across devices, set Supabase's Confirm signup email link to:
`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`
The callback also supports the normal PKCE `code` flow (same browser as signup).

## Frontend form contract (no UI included)

Client components import server actions:
```tsx
import { signUp, signIn, signOut } from '@/lib/auth/actions';
// Inside a submit handler, call event.preventDefault() first.
const result = await signIn(new FormData(formElement));
// signUp accepts the same FormData. Fields: email, password, optional next.
if (!result.ok) { /* Render result.error, using role="alert". */ }
else if (result.requiresEmailConfirmation) { /* Show "Check your email". */ }
else { router.replace(result.redirectTo); router.refresh(); }
// Logout button:
const logout = await signOut();
if (logout.ok) { router.replace(logout.redirectTo); router.refresh(); }
```
Use `email` and `password` field names; signup requires 8–128 password characters. Disable duplicate submissions while pending. Display errors rather than assuming success. `next` is restricted to local app routes. Never store passwords or session tokens in frontend storage. Do not call these actions through GET requests; Next.js server actions use POST and origin checks.

## Sessions and protection

HTTP-only, SameSite=Lax cookies persist sessions, with Secure cookies in production. Next.js 15 `src/middleware.ts` refreshes cookies and verifies identity with Supabase `getUser()` before allowing `/dashboard`, `/forecasts`, `/planner`, `/analytics`, `/settings`, `/onboarding` and descendants. Missing configuration returns 503 on protected routes. Unauthenticated requests redirect to `/login?next=...`. Landing/login/signup/callback remain public. Existing login UI must be wired by the UI developer; no signup page was added.

In future server actions, server components or route handlers that access private data:
```ts
import { requireUser, getCurrentUser } from '@/lib/auth/server';
const user = await requireUser(); // redirects unauthenticated users
// getCurrentUser() verifies the cookie with Supabase; returns User | null.
```
Route protection does not replace database RLS or backend API authorization. Existing FastAPI endpoints are unchanged and are NOT secured by this Next.js middleware. Validate Supabase access tokens independently there before exposing private records. Logout ends the current session; already-issued access tokens can remain valid until their expiry.

## Verification

Run `node ../../node_modules/typescript/bin/tsc --noEmit --incremental false` from the web app. Once configured, manually verify signup with email confirmation, login, reload persistence, expired-token refresh, logout, private-route denial and failed credentials. Provider setup is required before claiming end-to-end authentication works.

## Antigravity adapter

`src/lib/auth.ts` preserves `loginWithCredentials` and `signupWithCredentials` signatures and forwards to server actions. No mock fallback, fabricated token or localStorage session remains. Login UI can keep using its adapter. Signup returning `requiresEmailConfirmation` should display the email-confirmation message without navigating to a private route. Full name/organization/role are not saved by this minimal adapter; never use a self-selected role for authorization. `rememberMe` is currently ignored: sessions persist in secure cookies. Await `clearStoredSession()` to log out; handle failure. The legacy synchronous `getStoredSession()` returns null because it cannot verify HTTP-only cookies. Use `getCurrentUser()` on the server. Antigravity should replace its old “Safe mock bridge active” UI message; no UI files were edited here.
