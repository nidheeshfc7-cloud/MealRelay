"use server";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "./server";
import type { AuthResult } from "./actions";

export async function saveProfile(form:FormData):Promise<AuthResult>{
  const value=(key:string)=>typeof form.get(key)==="string"?String(form.get(key)).trim():"";
  const name=value("fullName"), organization=value("organization"), kitchen=value("kitchenName");
  if([name,organization,kitchen].some(text=>!text||text.length>120))
    return {ok:false,code:"INVALID_PROFILE",error:"Name, organization and kitchen are required (up to 120 characters each)."};
  try{
    const client=await createAuthClient();
    const {data:user,error:authError}=await client.auth.getUser();
    if(authError||!user.user)return {ok:false,code:"UNAUTHENTICATED",error:"Please sign in again before saving."};
    // Display preferences only. Metadata never controls ownership or access.
    const {error}=await client.auth.updateUser({data:{full_name:name,organization,kitchen_name:kitchen}});
    if(error)return {ok:false,code:"PROFILE_FAILED",error:"Unable to save your profile. Please retry."};
    revalidatePath("/","layout");
    return {ok:true,redirectTo:"/settings"};
  }catch{return {ok:false,code:"PROFILE_UNAVAILABLE",error:"Unable to reach your account. Please retry."};}
}
