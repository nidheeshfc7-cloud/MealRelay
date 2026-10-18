import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/auth/server";
import { safeNext } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  const siteUrl = process.env.AUTH_SITE_URL;
  if (!siteUrl) return NextResponse.json({ error: "AUTH_NOT_CONFIGURED" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  const params = request.nextUrl.searchParams;
  try {
    const client = await createAuthClient();
    const code = params.get("code");
    const token = params.get("token_hash");
    const result = code ? await client.auth.exchangeCodeForSession(code)
      : token && params.get("type") === "email" ? await client.auth.verifyOtp({ token_hash: token, type: "email" }) : null;
    if (result && !result.error) return NextResponse.redirect(new URL(safeNext(params.get("next")), siteUrl), { headers: { "Cache-Control": "private, no-store" } });
  } catch { /* Never expose provider details or tokens in errors. */ }
  return NextResponse.redirect(new URL("/login?error=confirmation_failed", siteUrl), { headers: { "Cache-Control": "private, no-store" } });
}
