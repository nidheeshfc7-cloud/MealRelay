"use client";
import Link from "next/link";
import { Building2, ChevronRight, LockKeyhole, Monitor, ShieldCheck, UserRound } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useAccountIdentity } from "@/components/auth/AccountIdentity";
import { ProfileSettingsForm } from "@/components/auth/ProfileSettingsForm";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { formatDefaultKitchenName } from "@/lib/auth/kitchenName";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const account = useAccountIdentity();
  const displayKitchen = account.kitchenName || (account.organization ? formatDefaultKitchenName(account.organization) : "Complete your kitchen profile");
  return <div className={styles.shell}>
    <Sidebar />
    <main className={styles.main}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Settings</p><h1>Kitchen &amp; account settings</h1><p className={styles.subtitle}>Manage your kitchen profile, workspace information and account security.</p></div>
        <a href="#workspace" className={styles.summary}>
          <span className={styles.summaryIcon}><Building2 size={25} /></span>
          <span><small>Your kitchen</small><strong>{displayKitchen}</strong><small>Account workspace</small></span>
          <ChevronRight size={19} />
        </a>
      </header>
      <div className={styles.columns}>
        <section id="profile" className={`${styles.card} ${styles.profile}`}>
          <div className={styles.cardHeading}><span className={styles.icon}><UserRound size={23} /></span><h2>Profile &amp; Kitchen</h2></div>
          <p className={styles.description}>These details appear in your workspace and help us personalise your experience.</p>
          <ProfileSettingsForm />
        </section>
        <div className={styles.aside}>
          <section id="security" className={`${styles.card} ${styles.security}`}>
            <div className={styles.securityHeading}><span className={styles.securityIcon}><LockKeyhole size={26} /></span><div><h2>Account security</h2><p>Keep your account safe with a strong password and secure sign-in.</p></div></div>
            <div className={styles.securityFooter}><div><small>Signed in as</small><strong>{account.email}</strong></div><Link href="/forgot-password" className={styles.resetPassword}>Reset password</Link></div>
          </section>
          <section className={styles.card} aria-labelledby="sessions-title">
            <div className={styles.cardHeading}><span className={styles.icon}><Monitor size={22} /></span><div><h2 id="sessions-title">Sessions</h2><p className={styles.description}>Control access to your account across devices.</p></div></div>
            <div className={styles.sessionRow}><Monitor size={22} /><div><strong>This signed-in browser <span className={styles.badge}>Current session</span></strong><p>Device and location details are unavailable.</p></div><ShieldCheck size={19} /></div>
            <div className={styles.sessionActions}><LogoutButton light /><LogoutButton light allDevices /></div>
          </section>
        </div>
      </div>
    </main>
  </div>;
}
