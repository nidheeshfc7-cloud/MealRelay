import React from 'react';
import type { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import phone from "../../../public/images/Angled Mealrelay Kitchen Dashboard Phone.png";
import styles from "./LoginPage.module.css";
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | MealRelay Operations',
  description: 'Access dining preparation, forecasting buffers, and surplus redistributions.',
};

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.promo} aria-label="MealRelay kitchen workspace">
          <p className={styles.promoNote}>Meals planned. Less wasted. A smarter tomorrow.</p>
          <div className={styles.promoCopy}>
            <div className={styles.rings} aria-hidden="true" />
            <h2>Run your<br /><span>kitchen smarter</span></h2>
            <p>Plan preparation, review demand and track your daily service — all in one connected workspace.</p>
          </div>
          <div className={styles.phone}>
            <Image src={phone} alt="Illustrative MealRelay kitchen dashboard on a phone" sizes="(max-width: 760px) 1px, (max-width: 1100px) 38vw, 400px" priority />
          </div>
          <p className={styles.promoFooter}>Better planning starts with your kitchen.</p>
        </aside>
        <section className={styles.panel} aria-labelledby="login-heading">
          <header className={styles.topBar}>
            <BrandLogo size="lg" />
            <Link href="/signup"><UserRound size={19} aria-hidden="true" />Sign up</Link>
          </header>
          <div className={styles.content}>
            <span className={styles.badge}><i aria-hidden="true" />Operational access</span>
            <h1 id="login-heading">Sign In</h1>
            <p className={styles.subtitle}>Your kitchen, ready for what&apos;s next.<br />Sign in to plan, prepare and serve smarter.</p>
            <div className={styles.form}><LoginForm /></div>
          </div>
          <div className={styles.bottomBar}><span>MealRelay · Kitchen operations</span><Link href="/"><ArrowLeft size={14} aria-hidden="true" />Back to home</Link></div>
        </section>
      </div>
    </main>
  );
}
