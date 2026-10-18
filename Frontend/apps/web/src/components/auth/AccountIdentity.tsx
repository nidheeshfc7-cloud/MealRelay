"use client";
import { createContext, useContext } from "react";
export type AccountIdentity = { id: string; email: string; name: string; organization: string; kitchenName: string };
const AccountContext = createContext<AccountIdentity | null>(null);
export function AccountIdentityProvider({ account, children }: { account: AccountIdentity; children: React.ReactNode }) {
  return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;
}
export function useAccountIdentity() {
  const account = useContext(AccountContext);
  if (!account) throw new Error("AccountIdentityProvider is required on authenticated pages.");
  return account;
}
