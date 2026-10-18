"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listActivityLogs, listMenuItems } from "@/lib/kitchen/actions";

export function KitchenRecordsSummary() {
  const [counts,setCounts] = useState<{ menu:number; logs:number; served:number }>();
  const [error,setError] = useState("");
  useEffect(()=>{let active=true;Promise.all([listMenuItems(),listActivityLogs()]).then(([menu,logs])=>{
    if(!active)return;
    if(!menu.ok||!logs.ok){setError(!menu.ok?menu.error:!logs.ok?logs.error:"");return;}
    setCounts({menu:menu.data.length,logs:logs.data.length,served:logs.data.reduce((sum,log)=>sum+log.served,0)});
  }).catch(()=>{if(active)setError("Saved kitchen records are temporarily unavailable.");});return()=>{active=false;};},[]);
  return <section aria-label="Your saved kitchen records" className="rounded-2xl border border-line-light bg-white p-4 flex flex-wrap gap-4 items-center justify-between">
    <div className="min-w-0"><h2 className="font-bold text-forest">Your saved kitchen records</h2>
      {error?<p role="status" className="text-sm text-ink-secondary mt-1">{error}</p>:counts?<p className="text-sm text-ink-secondary mt-1">{counts.menu} menu items · {counts.logs} latest activity logs · {counts.served} portions served in those logs</p>:<p className="text-sm text-ink-secondary mt-1">Loading your account records…</p>}
      <p className="text-sm text-ink-secondary mt-1">The forecasting plan below uses the existing shared demonstration engine; private activity is stored separately.</p>
    </div>
    <Link href="/records" className="px-4 py-3 rounded-xl bg-forest text-lime font-semibold">Manage services &amp; activity</Link>
  </section>;
}

