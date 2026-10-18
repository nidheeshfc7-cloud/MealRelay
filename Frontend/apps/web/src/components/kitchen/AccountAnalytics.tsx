"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listActivityLogs, listMenuItems } from "@/lib/kitchen/actions";
import type { ActivityLog, MenuItem } from "@/lib/kitchen/types";
import { buildActivityCsv, summarizeActivity } from "@/lib/kitchen/analytics";
import { WorkspaceShell } from "./WorkspaceShell";

export function AccountAnalytics(){
  const [logs,setLogs]=useState<ActivityLog[]>([]),[menu,setMenu]=useState<MenuItem[]>([]);
  const [busy,setBusy]=useState(true),[error,setError]=useState("");
  useEffect(()=>{let active=true;Promise.all([listActivityLogs(),listMenuItems()]).then(([records,items])=>{
    if(!active)return;
    if(!records.ok){setError(records.error);return;}if(!items.ok){setError(items.error);return;}
    setLogs(records.data);setMenu(items.data);
  }).catch(()=>{if(active)setError("Unable to load your saved activity. Please retry.");}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[]);
  const total=summarizeActivity(logs);
  const rate=total.rate;
  const dates=[...new Set(logs.map(row=>row.service_date))].sort().slice(-7);
  const volumes=dates.map(date=>({date,served:logs.filter(log=>log.service_date===date).reduce((sum,log)=>sum+log.served,0)}));
  const peak=Math.max(1,...volumes.map(day=>day.served));
  function download(){
    const blob=new Blob([buildActivityCsv(logs,menu)],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),anchor=document.createElement("a");
    anchor.href=url;anchor.download="mealrelay-activity.csv";anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <WorkspaceShell title="Food & service analytics" description="Actual results from your latest 100 saved activity records. No estimated savings or forecast accuracy claims.">
    <div className="flex items-center gap-3 flex-wrap"><button type="button" onClick={download} disabled={busy||!logs.length} className="px-5 py-3 rounded-xl bg-forest text-lime font-bold disabled:opacity-50">Export activity CSV</button><Link href="/records" className="px-5 py-3 rounded-xl border border-line-light bg-white font-semibold">Manage activity</Link></div>
    {error&&<p role="alert" className="p-4 bg-red-50 text-red-800 rounded-xl">{error}</p>}
    {busy?<p role="status" className="p-5 bg-white rounded-2xl border border-line-light">Loading your saved records…</p>:!logs.length?<section className="bg-white border border-line-light rounded-2xl p-8"><h2 className="text-xl font-bold">Your first service starts here</h2><p className="text-ink-secondary mt-2">Add a menu and record prepared, served and leftover portions. Your results will appear here.</p></section>:<>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">{[{label:"Prepared portions",value:total.prepared.toLocaleString()},{label:"Served portions",value:total.served.toLocaleString()},{label:"Leftover portions",value:total.leftover.toLocaleString()},{label:"Leftover share",value:rate+"%"}].map(metric=><section key={metric.label} className="bg-white border border-line-light rounded-2xl p-5"><h2 className="text-sm font-semibold text-ink-secondary">{metric.label}</h2><p className="text-3xl font-black text-forest mt-2">{metric.value}</p></section>)}</div>
      <section className="bg-white border border-line-light rounded-2xl p-5 sm:p-8 space-y-5">
        <div><h2 className="text-xl font-bold">Served portions by date</h2><p className="text-sm text-ink-secondary mt-1">Up to seven recent service dates within the loaded records.</p></div>
        <ul className="space-y-4">{volumes.map(day=><li key={day.date} className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center"><span className="text-sm font-semibold">{day.date}</span><div className="sm:col-span-2 h-4 bg-sage rounded-full overflow-hidden" aria-hidden="true"><div className="h-full bg-forest rounded-full" style={{width:(100*day.served/peak)+"%"}}/></div><span className="text-sm font-semibold text-forest">{day.served.toLocaleString()} portions</span></li>)}</ul>
      </section>
      <section className="bg-white border border-line-light rounded-2xl p-5 sm:p-8 space-y-4"><h2 className="text-xl font-bold">Service breakdown</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{["breakfast","lunch","dinner"].map(service=>{const records=logs.filter(log=>log.meal_service===service);return <div key={service} className="rounded-xl bg-canvas p-4"><h3 className="font-bold capitalize">{service}</h3><p className="text-sm text-ink-secondary mt-2">{records.reduce((sum,log)=>sum+log.served,0).toLocaleString()} served · {records.reduce((sum,log)=>sum+log.leftover,0).toLocaleString()} left over</p></div>;})}</div><p className="text-sm text-ink-secondary">Attendance is recorded per dish and is not added across dishes to avoid counting diners twice.</p></section>
    </>}
  </WorkspaceShell>;
}
