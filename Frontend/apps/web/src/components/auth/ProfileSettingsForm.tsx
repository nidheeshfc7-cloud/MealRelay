"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccountIdentity } from "./AccountIdentity";
import { Mail, Phone } from "lucide-react";
import styles from "@/app/settings/settings.module.css";
import { saveProfile } from "@/lib/auth/profile";

export function ProfileSettingsForm(){
  const account=useAccountIdentity(),router=useRouter();
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");setMessage("");
    try{const result=await saveProfile(form);if(!result.ok){setError(result.error);return;}setMessage("Your profile and kitchen names have been saved.");router.refresh();}
    catch{setError("Unable to save. Please retry.");}finally{setBusy(false);}
  }
  return <form onSubmit={submit} className={styles.form}>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {message&&<p role="status" className={styles.success}>{message}</p>}
    {[{name:"fullName",label:"Your name",value:account.name},{name:"organization",label:"Organization / restaurant",value:account.organization,hint:"e.g. your restaurant, mess or hostel kitchen."},{name:"kitchenName",label:"Kitchen name",value:account.kitchenName,hint:"The name shown in your workspace."}].map(field=><label id={field.name==="organization"?"workspace":undefined} key={field.name} className={styles.field}>{field.label}<input name={field.name} defaultValue={field.value} maxLength={120} required autoComplete={field.name==="fullName"?"name":field.name==="organization"?"organization":"off"} />{field.hint&&<small>{field.hint}</small>}</label>)}
    <div className={styles.contactFields}>
      <label className={styles.field}>Contact email<span className={styles.inputIcon}><Mail size={18}/><input type="email" value={account.email} readOnly autoComplete="email" /></span><small>Used for account security and recovery.</small></label>
      <label className={styles.field}>Contact phone <span className={styles.optional}>(optional)</span><span className={styles.inputIcon}><Phone size={18}/><input disabled placeholder="Not configured" aria-describedby="phone-unavailable" /></span><small id="phone-unavailable">Phone settings are coming soon.</small></label>
    </div>
    <div className={styles.formActions}><button type="submit" disabled={busy} className={styles.save}>{busy?"Saving…":"Save changes"}</button><button type="reset" disabled={busy} onClick={()=>{setMessage("");setError("");}} className={styles.cancel}>Cancel</button></div>
  </form>;
}
