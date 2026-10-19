import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "./config";

export async function createAuthClient() {
  const { url, key } = authConfig();
  const store = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
    cookies: {
      getAll: () => store.getAll(),
      setAll: values => {
        // Server Components cannot write cookies; middleware handles refresh there.
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch (error) { if (!(error instanceof Error) || !error.message.includes("Cookies can only be modified")) throw error; }
      },
    },
  });
}

export async function getCurrentUser() {
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
