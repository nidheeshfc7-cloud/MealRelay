'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { loginWithCredentials, AUTH_CONFIG } from '@/lib/auth';
import styles from './auth.module.css';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(searchParams.get("error") === "confirmation_failed" ? "This confirmation link is invalid or expired. Sign in if already confirmed, or request a new confirmation email." : null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Institutional email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email format (e.g., chef@institution.edu).';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 1) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await loginWithCredentials({ email, password, next: nextUrl });
      if (result.success) {
        const destination = result.redirectTo || nextUrl || '/dashboard';
        router.replace(destination);
        router.refresh();
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setErrorMessage('Unexpected network or server error during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {searchParams.get("notice") === "password_updated" && <p role="status" className="p-4 rounded-xl bg-sage text-forest mb-4">Password updated. Sign in with your new password.</p>}
      {errorMessage && (
        <div className={styles.bannerError} role="alert">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className={styles.formGroup}>
          <label htmlFor="login-email" className={styles.label}>
            Institutional Email
          </label>
          <div className={styles.inputWrapper}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              suppressHydrationWarning // Autofill extensions may inject fdprocessedid before hydration.
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="operator@institution.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              className={`${styles.input} ${fieldErrors.email ? styles.inputWithError : ''}`}
            />
          </div>
          {fieldErrors.email && (
            <div className={styles.fieldError}>
              <AlertCircle size={12} />
              <span>{fieldErrors.email}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="login-password" className={styles.label}>
            Password
          </label>
          <div className={styles.inputWrapper}>
            <Lock size={16} className={styles.inputIcon} />
            <input
              suppressHydrationWarning // Ignore extension-only attributes on this control.
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              className={`${styles.input} ${fieldErrors.password ? styles.inputWithError : ''}`}
            />
            <button
              type="button"
              suppressHydrationWarning
              className={styles.visibilityToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <div className={styles.fieldError}>
              <AlertCircle size={12} />
              <span>{fieldErrors.password}</span>
            </div>
          )}
        </div>

        <div className={styles.secondaryRow}>
          <span className="text-sm text-ink-secondary">Secure session</span>
          <Link href="/forgot-password" className={styles.linkAccent}>Forgot password?</Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          suppressHydrationWarning
          disabled={isLoading}
          className={styles.primaryButton}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Authenticating Session...</span>
            </>
          ) : (
            <>
              <span>Sign In to MealRelay</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Integration Status Note */}
      <div className={styles.integrationNote}>
        {AUTH_CONFIG.isIntegrationPending
          ? 'Authentication is unavailable. Please contact the site owner.'
          : 'Connected to operational Supabase authentication.'}
      </div>

      {/* Footer Navigation */}
      <div className={styles.footerDivider}>
        <span>New kitchen facility?</span>
        <Link href="/signup" className={styles.linkAccent}>
          Create Facility Account →
        </Link>
      </div>

      <div className="mt-3 text-center">
        <Link href="/" className="text-xs text-[#718078] hover:text-[#003f2f] transition-colors">
          ← Return to Public Overview
        </Link>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-xs text-[#718078]">Loading authentication...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
