import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/config";

function navigationUrl(path: string, request: NextRequest) {
  const url = new URL(path, request.url);
  // Preserve the browser-facing host when Next runs behind a tunnel/proxy.
  const host = request.headers.get("host");
  if (host && /^[a-z0-9.\-]+(?::\d+)?$/i.test(host)) {
    url.port = "";
    url.host = host;
  }
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  if (protocol === "https" || protocol === "http") url.protocol = `${protocol}:`;
  return url;
}

export async function middleware(request: NextRequest) {
  const protectedRoute = /^\/(dashboard|forecasts|planner|analytics|settings|onboarding|menu|records|reset-password)(?:\/|$)/.test(request.nextUrl.pathname);
  let config;
  try { config = authConfig(); }
  catch {
    return protectedRoute ? NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "private, no-store" } }) : NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const client = createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  let authenticated = false;
  try { const { data, error } = await client.auth.getUser(); authenticated = !error && !!data.user; }
  catch { /* Deny protected access when verification fails. */ }
  if (protectedRoute && !authenticated) {
    const login = navigationUrl("/login", request);
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response = redirect;
  }
  if (request.method === "GET" && authenticated && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
    const redirect = NextResponse.redirect(navigationUrl("/dashboard", request));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response = redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/reset-password", "/menu/:path*", "/records/:path*", "/dashboard/:path*", "/forecasts/:path*", "/planner/:path*", "/analytics/:path*", "/settings/:path*", "/onboarding/:path*", "/login", "/signup", "/auth/:path*"] };
