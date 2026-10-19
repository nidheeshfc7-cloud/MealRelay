import { RecoveryForm } from "@/components/auth/RecoveryForm";
export default async function ForgotPasswordPage({searchParams}:{searchParams:Promise<{error?:string}>}){
  const params=await searchParams;
  return <RecoveryForm mode="request" error={params.error==="invalid_link"?"This reset link is invalid or expired. Request a new one.":""}/>;
}
