import { requireUser } from "@/lib/auth/server";
import { AccountIdentityProvider } from "./AccountIdentity";
export async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const metadata = user.user_metadata;
  const text = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 120) : "";
  const email = user.email ?? "";
  // Metadata is presentation only, never an authorization source.
  const account = { id: user.id, email, name: text(metadata.full_name) || email.split("@")[0] || "Your account", organization: text(metadata.organization) || "Your kitchen", kitchenName: text(metadata.kitchen_name) || text(metadata.organization) || "Your kitchen" };
  return <AccountIdentityProvider key={user.id} account={account}>{children}</AccountIdentityProvider>;
}
