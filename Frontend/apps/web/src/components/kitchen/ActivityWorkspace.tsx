"use client";
import { useEffect, useState } from "react";
import { listMenuItems, listActivityLogs, saveActivityLog, deleteActivityLog } from "@/lib/kitchen/actions";
import type { ActivityInput, ActivityLog, MenuItem } from "@/lib/kitchen/types";
import { WorkspaceShell } from "./WorkspaceShell";
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const blank=():ActivityInput=>({menu_item_id:"",service_date:today(),meal_service:"lunch",prepared:0,served:0,leftover:0,attendance:0,notes:""});
const control="block w-full rounded-xl bg-white border border-line-light p-3 text-base";
export function ActivityWorkspace(){
  const [menu,setMenu]=useState<MenuItem[]>([]);
  const [logs,setLogs]=useState<ActivityLog[]>([]);
  const [form,setForm]=useState<ActivityInput>(blank);
  const [editing,setEditing]=useState<string>();
  const [filter,setFilter]=useState("");
  const [page,setPage]=useState(0);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  async function load(date=filter,offset=page*100){const result=await listActivityLogs(date||undefined,offset);if(result.ok)setLogs(result.data);else setError(result.error);}
  useEffect(()=>{let active=true;setBusy(true);setError("");Promise.all([listMenuItems(),listActivityLogs(filter||undefined,page*100)]).then(([items,records])=>{if(!active)return;if(items.ok)setMenu(items.data);else setError(items.error);if(records.ok)setLogs(records.data);else setError(records.error);}).catch(()=>{if(active)setError("Unable to load kitchen records.");}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};},[filter,page]);
  async function save(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError("");setMessage("");
    try{const result=await saveActivityLog(form,editing);if(!result.ok){setError(result.error);return;}setEditing(undefined);setForm(blank());await load();setMessage("Activity saved to your account.");}
    catch{setError("Unable to reach the server. Your entry has not been cleared.");}finally{setBusy(false);}
  }
  async function remove(id:string){if(!confirm("Delete this activity log?"))return;setBusy(true);setError("");setMessage("");try{const result=await deleteActivityLog(id);if(result.ok){await load();setMessage("Activity deleted.");}else setError(result.error);}catch{setError("Unable to reach the server.");}finally{setBusy(false);}}
  return <WorkspaceShell title="Daily kitchen activity" description="Record preparation, service and leftovers for your own saved menu.">
    {error&&<p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message&&<p role="status" className="p-4 rounded-xl bg-sage text-forest">{message}</p>}
    <form onSubmit={save} className="rounded-2xl bg-white border border-line-light p-5 space-y-4">
      <h2 className="text-xl font-bold">{editing?"Edit activity":"Add daily activity"}</h2>
      {!menu.length&&!busy&&<p className="text-ink-secondary">Save a dish in Menu management before adding activity.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="font-semibold text-sm">Date<input required type="date" value={form.service_date} className={control} onChange={e=>setForm({...form,service_date:e.target.value})}/></label>
        <label className="font-semibold text-sm">Service<select className={control} value={form.meal_service} onChange={e=>setForm({...form,meal_service:e.target.value as ActivityInput["meal_service"]})}>{["breakfast","lunch","dinner"].map(service=><option key={service}>{service}</option>)}</select></label>
        <label className="font-semibold text-sm">Menu item<select required className={control} value={form.menu_item_id} onChange={e=>setForm({...form,menu_item_id:e.target.value})}><option value="">Select a saved dish</option>{menu.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {(["prepared","served","leftover","attendance"] as const).map(key=><label key={key} className="font-semibold text-sm capitalize">{key}<input required type="number" min="0" max="2147483647" step="1" className={control} value={form[key]} onChange={e=>setForm({...form,[key]:Number(e.target.value)})}/></label>)}
      </div>
      <p className="text-sm text-ink-secondary">Prepared must equal served plus leftover. Quantities are portions; attendance is the number of diners.</p>
      <label className="block font-semibold text-sm">Notes (optional)<textarea className={control} maxLength={2000} rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <div className="flex gap-3 flex-wrap"><button className="px-4 py-3 bg-forest text-lime rounded-xl font-semibold disabled:opacity-50" disabled={busy||!menu.length}>{busy?"Saving / loading…":"Save activity"}</button>{editing&&<button type="button" disabled={busy} className="px-4 py-3" onClick={()=>{setEditing(undefined);setForm(blank());}}>Cancel edit</button>}</div>
    </form>
    <section className="rounded-2xl bg-white border border-line-light p-5 space-y-4" aria-busy={busy}>
      <h2 className="text-xl font-bold">Saved activity</h2>
      <label className="block max-w-xs font-semibold text-sm">Filter by date<input type="date" className={control} value={filter} onChange={e=>{setFilter(e.target.value);setPage(0);}}/></label>
      {filter&&<button className="py-3 text-forest font-semibold" onClick={()=>{setFilter("");setPage(0);}}>Show all dates</button>}
      {!logs.length&&!busy&&<p className="text-ink-secondary">No saved activity for this selection.</p>}
      <ul className="divide-y divide-line-light">{logs.map(log=><li key={log.id} className="py-4 space-y-2">
        <div className="flex flex-wrap justify-between gap-3"><div><p className="font-bold break-words">{menu.find(item=>item.id===log.menu_item_id)?.name||"Saved menu item"}</p><p className="text-sm text-ink-secondary">{log.service_date} · {log.meal_service}</p></div><div className="flex gap-3"><button disabled={busy} className="py-3 px-3 text-forest font-semibold" onClick={()=>{setEditing(log.id);setForm({menu_item_id:log.menu_item_id,service_date:log.service_date,meal_service:log.meal_service,prepared:log.prepared,served:log.served,leftover:log.leftover,attendance:log.attendance,notes:log.notes});setMessage("Editing saved activity. Review the form above.");}}>Edit</button><button disabled={busy} className="py-3 px-3 text-red-800 font-semibold" onClick={()=>void remove(log.id)}>Delete</button></div></div>
        <p className="text-sm">Prepared {log.prepared} · Served {log.served} · Leftover {log.leftover} · Diners {log.attendance}</p>
        {log.notes&&<p className="text-sm text-ink-secondary whitespace-pre-wrap break-words">{log.notes}</p>}
      </li>)}</ul>
      <div className="flex gap-4 items-center"><button disabled={busy||!page} className="py-3 disabled:opacity-50" onClick={()=>setPage(p=>p-1)}>Previous</button><span className="text-sm">Page {page+1}</span><button disabled={busy||logs.length<100} className="py-3 disabled:opacity-50" onClick={()=>setPage(p=>p+1)}>Next</button></div>
    </section>
  </WorkspaceShell>;
}

