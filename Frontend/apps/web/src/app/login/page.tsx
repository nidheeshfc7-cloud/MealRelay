import mobile from "@/components/landing/MobileBackgrounds.module.css";
import React from 'react';
import type { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import background from "../../../public/images/Smarter Kitchens, Sustainable Tomorrow.png";
import styles from "./LoginPage.module.css";
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | MealRelay Operations',
  description: 'Sign in to plan meals and track daily kitchen activity.',
};

export default function LoginPage() {
  return (
    <main className={`${styles.page} ${mobile.dark}`}>
      <div className={styles.shell}>
        <Image src={background} alt="" className={styles.background} sizes="100vw" priority />
        <aside className={styles.promo} aria-label="Run your kitchen smarter. Access dining preparation, forecasting buffers and institutional surplus logs." />
        <section className={styles.panel} aria-labelledby="login-heading">
          <header className={styles.topBar}>
            <BrandLogo size="lg" />
            <Link href="/signup"><UserRound size={19} aria-hidden="true" />Sign up</Link>
          </header>
          <div className={styles.content}>
            <h1 id="login-heading">Sign In</h1>
            <p className={styles.subtitle}>Plan your meals, check quantities<br />and keep track of leftovers.</p>
            <div className={styles.form}><LoginForm /></div>
          </div>

        </section>
      </div>
    </main>
  );
}
