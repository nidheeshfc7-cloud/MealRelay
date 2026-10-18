"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "./AuthCard";
import { requestPasswordReset, resendConfirmation, updatePassword } from "@/lib/auth/recovery";
import styles from "./auth.module.css";

export function RecoveryForm({mode,error:initialError=""}:{mode:"request"|"update"|"confirm";error?:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(initialError),[message,setMessage]=useState("");
  const update=mode==="update",confirm=mode==="confirm";
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");setMessage("");
    try{
      const result=await (update?updatePassword(form):confirm?resendConfirmation(form):requestPasswordReset(form));
      if(!result.ok){setError(result.error);return;}
      if(update){window.location.assign(result.redirectTo);return;}
      setMessage(confirm?"If your account needs confirmation, an email has been sent. Check your inbox and spam folder.":"If an account exists for that email, you will receive a password reset link. Check your inbox and spam folder.");
    }catch{setError("Unable to reach the server. Please retry.");}finally{setBusy(false);}
  }
  return <AuthCard title={update?"Choose a new password":confirm?"Confirm your email":"Reset your password"} subtitle={update?"Update your password, then sign in again.":confirm?"Request a fresh confirmation link for your account.":"We’ll email you a secure link to recover your account."}>
    {error&&<p role="alert" className={styles.bannerError}>{error}</p>}
    {message&&<p role="status" className="rounded-xl bg-sage text-forest p-4 mb-4 text-sm">{message}</p>}
    <form onSubmit={submit}>
      {update?<><label className={`${styles.formGroup} block`}><span className={styles.label}>New password</span><input className={styles.input} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label>
        <label className={`${styles.formGroup} block`}><span className={styles.label}>Confirm new password</span><input className={styles.input} name="confirmation" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label></>
        :<label className={`${styles.formGroup} block`}><span className={styles.label}>Email address</span><input className={styles.input} name="email" type="email" autoComplete="email" maxLength={254} required/></label>}
      <button className={styles.primaryButton} disabled={busy} type="submit">{busy?"Please wait…":update?"Update password":confirm?"Send confirmation email":"Send reset email"}</button>
    </form>
    <div className="mt-5 flex justify-between gap-3 flex-wrap text-sm"><Link href="/login" className={styles.linkAccent}>Back to sign in</Link>{!confirm&&<Link href="/confirm-email" className={styles.linkAccent}>Resend confirmation</Link>}</div>
  </AuthCard>;
}
