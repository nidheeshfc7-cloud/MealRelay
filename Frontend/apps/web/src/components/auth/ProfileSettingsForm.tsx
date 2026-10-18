"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccountIdentity } from "./AccountIdentity";
import { saveProfile } from "@/lib/auth/profile";

export function ProfileSettingsForm(){
  const account=useAccountIdentity(),router=useRouter();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");setMessage("");
    try{const result=await saveProfile(form);if(!result.ok){setError(result.error);return;}setMessage("Your profile and kitchen names have been saved.");router.refresh();}
    catch{setError("Unable to save. Please retry.");}finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="space-y-5">
    {error&&<p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800">{error}</p>}
    {message&&<p role="status" className="p-4 rounded-xl bg-sage text-forest">{message}</p>}
    {[{name:"fullName",label:"Your name",value:account.name},{name:"organization",label:"Organization / restaurant",value:account.organization},{name:"kitchenName",label:"Kitchen name",value:account.kitchenName}].map(field=><label key={field.name} className="block font-semibold text-sm">{field.label}<input name={field.name} defaultValue={field.value} maxLength={120} required className="block mt-2 w-full rounded-xl border border-line-light bg-canvas p-3 text-base"/></label>)}
    <div className="flex gap-3 flex-wrap"><button type="submit" disabled={busy} className="px-5 py-3 rounded-xl bg-forest text-lime font-bold disabled:opacity-50">{busy?"Saving…":"Save changes"}</button><button type="reset" disabled={busy} onClick={()=>{setMessage("");setError("");}} className="px-5 py-3 rounded-xl border border-line-light font-semibold">Reset form</button></div>
  </form>;
}
