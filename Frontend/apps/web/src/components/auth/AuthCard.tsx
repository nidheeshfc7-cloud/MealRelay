'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';
import styles from './auth.module.css';

interface AuthCardProps {
  badgeText?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({
  badgeText = 'Kitchen Operations OS',
  title,
  subtitle,
  children,
}: AuthCardProps) {
  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        <div className={styles.header}>
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" />
          </div>
          {badgeText && (
            <div className={styles.badge}>
              <span className={styles.badgeDot} />
              {badgeText}
            </div>
          )}
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.authCard}>{children}</div>
      </div>
    </div>
  );
}
