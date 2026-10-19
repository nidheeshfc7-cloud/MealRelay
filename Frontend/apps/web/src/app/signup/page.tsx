import React from 'react';
import type { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import background from "../../../public/images/Smarter Kitchens, Sustainable Tomorrow.png";
import shared from "../login/LoginPage.module.css";
import styles from "./SignupPage.module.css";
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create Kitchen Workspace | MealRelay',
  description: 'Register your institutional kitchen, dining hall, or food recovery team on MealRelay.',
};

export default function SignupPage() {
  return (
    <main className={shared.page}>
      <div className={shared.shell}>
        <Image src={background} alt="" className={shared.background} sizes="(max-width: 760px) 1px, 100vw" priority />
        <aside className={shared.promo} aria-label="Run your kitchen smarter. Access dining preparation, forecasting buffers and institutional surplus logs." />
        <section className={`${shared.panel} ${styles.panel}`} aria-labelledby="signup-heading">
          <header className={shared.topBar}>
            <BrandLogo size="lg" />
            <Link href="/login"><UserRound size={19} aria-hidden="true" />Sign in</Link>
          </header>
          <div className={`${shared.content} ${styles.content}`}>
            <span className={shared.badge}><i aria-hidden="true" />Workspace setup</span>
            <h1 id="signup-heading">Create account</h1>
            <p className={shared.subtitle}>Bring your kitchen into one connected workspace.</p>
            <div className={`${shared.form} ${styles.form}`}><SignupForm /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
