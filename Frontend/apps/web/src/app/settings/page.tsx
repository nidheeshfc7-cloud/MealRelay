"use client";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useAccountIdentity } from "@/components/auth/AccountIdentity";
import { ProfileSettingsForm } from "@/components/auth/ProfileSettingsForm";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function SettingsPage(){
  const account=useAccountIdentity();
  return <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row">
    <Sidebar/>
    <main className="flex-1 min-w-0 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      <Header title="Kitchen & account settings" subtitle="Manage your profile, workspace names and account security."/>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-3xl bg-white border border-line-light p-5 sm:p-8 space-y-5">
          <div><h2 className="text-xl font-bold">Your profile & kitchen</h2><p className="mt-2 text-sm text-ink-secondary">These names appear in your workspace. Your saved records stay private to your account.</p></div>
          <ProfileSettingsForm/>
        </section>
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-3xl bg-forest text-white border border-line-dark p-5 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold">Account security</h2>
            <div><p className="text-sm text-white/70">Signed in as</p><p className="font-semibold break-all">{account.email}</p></div>
            <Link href="/forgot-password" className="inline-flex rounded-xl px-4 py-3 bg-lime text-forest font-bold">Reset password</Link>
            <p className="text-sm text-white/70">A secure recovery link is sent to your email. Use a different password from other sites.</p>
          </section>
          <section className="rounded-3xl bg-white border border-line-light p-5 sm:p-8 space-y-3">
            <h2 className="text-xl font-bold">Sessions</h2><p className="text-sm text-ink-secondary">Log out here, or revoke sign-ins across your devices.</p>
            <LogoutButton light/><LogoutButton light allDevices/>
          </section>
          <section className="rounded-3xl bg-white border border-line-light p-5 space-y-2">
            <h2 className="font-bold">Notifications</h2><p className="text-sm text-ink-secondary">Scheduled email notifications are not configured yet. Your saved menus and activity remain available in this workspace.</p>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
