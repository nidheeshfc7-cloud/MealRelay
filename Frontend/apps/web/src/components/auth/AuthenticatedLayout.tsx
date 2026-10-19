import { requireUser } from "@/lib/auth/server";
import { formatDefaultKitchenName } from "@/lib/auth/kitchenName";
import { AccountIdentityProvider } from "./AccountIdentity";

export const AuthenticatedLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await requireUser();
  const metadata = user.user_metadata;
  const text = (value: unknown): string => typeof value === "string" ? value.trim().slice(0, 120) : "";
  const email = user.email ?? "";
  const org = text(metadata.organization);
  const rawKitchen = text(metadata.kitchen_name);

  // Explicit user kitchen name ALWAYS takes precedence and is NEVER overwritten.
  // Default formatDefaultKitchenName(org) is strictly a fallback when kitchen_name is missing/empty.
  const kitchenName = rawKitchen ? rawKitchen : (org ? formatDefaultKitchenName(org) : "Your kitchen");

  // Metadata is presentation only, never an authorization source.
  const account = {
    id: user.id,
    email,
    name: text(metadata.full_name) || email.split("@")[0] || "Your account",
    organization: org || "Your kitchen",
    kitchenName,
  };

  return <AccountIdentityProvider key={user.id} account={account}>{children}</AccountIdentityProvider>;
};
