"use client";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

export function LogoutButton({ compact=false, allDevices=false, light=false }: { compact?:boolean; allDevices?:boolean; light?:boolean }) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const label=allDevices?"Log out all devices":"Log out";
  async function logout(){
    if(busy)return;
    setBusy(true);setError("");
    try {
      const result=await signOut(allDevices?"global":"local");
      if(!result.ok){setError(result.error);setBusy(false);return;}
      // Full navigation discards cached private React screens.
      window.location.assign("/login");
    } catch {setError("Unable to log out. Please retry.");setBusy(false);}
  }
  return <div className="min-w-0">
    <button type="button" onClick={()=>void logout()} disabled={busy} title={label} aria-label={label}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 font-semibold text-sm transition-colors disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime ${compact?"justify-center":"w-full"} ${light?"border border-line-light text-forest hover:bg-sage":"text-white hover:bg-white/10"}`}>
      {busy?<Loader2 size={18} className="animate-spin shrink-0"/>:<LogOut size={18} className="shrink-0"/>}
      <span className={compact?"sr-only":""}>{busy?"Logging out…":label}</span>
    </button>
    {error&&<p role="alert" className={`mt-2 text-sm break-words ${light?"text-red-800":"text-red-200"}`}>{error}</p>}
  </div>;
}
