import Link from "next/link";
import { WorkspaceShell } from "@/components/kitchen/WorkspaceShell";
import { ProfileSettingsForm } from "@/components/auth/ProfileSettingsForm";
export default function OnboardingPage(){
  return <WorkspaceShell title="Set up your kitchen" description="Save your name and kitchen details, then start managing your menu and daily service.">
    <section className="rounded-3xl bg-white border border-line-light p-5 sm:p-8 max-w-2xl space-y-5">
      <ProfileSettingsForm/>
      <div className="border-t border-line-light pt-5 flex gap-3 flex-wrap">
        <Link href="/menu" className="px-5 py-3 rounded-xl bg-forest text-lime font-bold">Build your menu</Link>
        <Link href="/dashboard" className="px-5 py-3 rounded-xl border border-line-light font-semibold">Open cooking plan</Link>
      </div>
    </section>
  </WorkspaceShell>;
}
