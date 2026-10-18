"use server";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "./server";
import type { AuthResult } from "./actions";

const failed=(code:string,error:string):AuthResult=>({ok:false,code,error});
async function emailAction(form:FormData,recovery:boolean):Promise<AuthResult>{
  const email=String(form.get("email")||"").trim();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return failed("INVALID_EMAIL","Enter a valid email address.");
  const origin=process.env.AUTH_SITE_URL;
  if(!origin)return failed("AUTH_NOT_CONFIGURED","Authentication setup is incomplete.");
  try{
    const client=await createAuthClient();
    const callback=new URL("/auth/callback",origin);
    callback.searchParams.set("next",recovery?"/reset-password":"/dashboard");
    const {error}=recovery?await client.auth.resetPasswordForEmail(email,{redirectTo:callback.toString()})
      :await client.auth.resend({type:"signup",email,options:{emailRedirectTo:callback.toString()}});
    if(error)return failed("EMAIL_UNAVAILABLE","Unable to send an email right now. Wait a moment, then retry.");
    // Same response for unknown and known accounts.
    return {ok:true,redirectTo:"/login"};
  }catch{return failed("EMAIL_UNAVAILABLE","Unable to send an email right now. Please retry.");}
}
export async function requestPasswordReset(form:FormData){return emailAction(form,true);}
export async function resendConfirmation(form:FormData){return emailAction(form,false);}
export async function updatePassword(form:FormData):Promise<AuthResult>{
  const password=form.get("password"), confirmation=form.get("confirmation");
  if(typeof password!=="string"||password.length<8||password.length>128||password!==confirmation)
    return failed("INVALID_PASSWORD","Use 8–128 characters and make sure both passwords match.");
  try{
    const client=await createAuthClient();
    const {data,error:authError}=await client.auth.getUser();
    if(authError||!data.user)return failed("RECOVERY_EXPIRED","Your session expired. Request a fresh password reset email.");
    const {error}=await client.auth.updateUser({password});
    if(error)return failed("PASSWORD_FAILED","Unable to update your password. Use a new password and retry.");
    const {error:logoutError}=await client.auth.signOut({scope:"global"});
    revalidatePath("/","layout");
    if(logoutError)return failed("PASSWORD_UPDATED_SIGNOUT_FAILED","Password updated. Please log out, then sign in using your new password.");
    return {ok:true,redirectTo:"/login?notice=password_updated"};
  }catch{return failed("PASSWORD_UNAVAILABLE","Unable to update your password right now. Please retry.");}
}
