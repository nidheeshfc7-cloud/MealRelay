'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { signupWithCredentials, AUTH_CONFIG } from '@/lib/auth';
import styles from './auth.module.css';

export function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Head Chef / Operations Lead');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full operator name is required.';
    }

    if (!organization.trim()) {
      errors.organization = 'Dining hall / institutional kitchen name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Institutional email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid institutional email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (password.length > 128) {
      errors.password = 'Password cannot exceed 128 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!termsAgreed) {
      errors.termsAgreed = 'Please confirm that you will review recommendations before use.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const result = await signupWithCredentials({
        fullName,
        email,
        password,
        organization,
        role,
      });

      if (result.requiresEmailConfirmation) {
        setRequiresConfirmation(true);
      } else if (result.success) {
        router.replace(result.redirectTo || '/dashboard');
        router.refresh();
      } else {
        setErrorMessage(result.error || 'Registration failed. Please check the entered details.');
      }
    } catch {
      setErrorMessage('Unexpected server error during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  if (requiresConfirmation) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-[#edf2e7] text-[#003f2f] flex items-center justify-center mx-auto mb-4 border border-[#e5ebe1]">
          <CheckCircle2 size={32} className="text-[#245c40]" />
        </div>
        <h2 className="text-xl font-black text-[#172a21] mb-2">Check Your Email</h2>
        <p className="text-xs text-[#718078] mb-6 leading-relaxed">
          We have dispatched a verification link to <strong className="text-[#172a21]">{email}</strong>.
          Please click the confirmation link to activate your institutional kitchen access.
        </p>

        <Link
          href="/login"
          className={styles.primaryButton}
        >
          <span>Return to Sign In</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && (
        <div className={styles.bannerError} role="alert">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name & Organization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={styles.formGroup}>
            <label htmlFor="signup-name" className={styles.label}>
              Operator Name
            </label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.inputIcon} />
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Marcus Vance"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className={`${styles.input} ${fieldErrors.fullName ? styles.inputWithError : ''}`}
              />
            </div>
            {fieldErrors.fullName && (
              <div className={styles.fieldError}>
                <AlertCircle size={12} />
                <span>{fieldErrors.fullName}</span>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="signup-org" className={styles.label}>
              Kitchen / Facility
            </label>
            <div className={styles.inputWrapper}>
              <Building size={16} className={styles.inputIcon} />
              <input
                id="signup-org"
                name="organization"
                type="text"
                placeholder="North Dining Hall"
                value={organization}
                onChange={(e) => {
                  setOrganization(e.target.value);
                  if (fieldErrors.organization) setFieldErrors((prev) => ({ ...prev, organization: '' }));
                }}
                className={`${styles.input} ${fieldErrors.organization ? styles.inputWithError : ''}`}
              />
            </div>
            {fieldErrors.organization && (
              <div className={styles.fieldError}>
                <AlertCircle size={12} />
                <span>{fieldErrors.organization}</span>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className={styles.formGroup}>
          <label htmlFor="signup-email" className={styles.label}>
            Institutional Email
          </label>
          <div className={styles.inputWrapper}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="m.vance@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
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

        {/* Role Select */}
        <div className={styles.formGroup}>
          <label htmlFor="signup-role" className={styles.label}>
            Job title (profile only)
          </label>
          <select
            id="signup-role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`${styles.input} pl-4 cursor-pointer`}
          >
            <option value="Head Chef / Operations Lead">Head Chef / Operations Lead</option>
            <option value="Kitchen Director / Food Services">Kitchen Director / Food Services</option>
            <option value="Inventory / Supply Chain Manager">Inventory / Supply Chain Manager</option>
            <option value="Food Recovery Partner / Shelter Lead">Food Recovery Partner / Shelter Lead</option>
          </select>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={styles.formGroup}>
            <label htmlFor="signup-password" className={styles.label}>
              Password (8+ chars)
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={`${styles.input} ${fieldErrors.password ? styles.inputWithError : ''}`}
              />
              <button
                type="button"
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

          <div className={styles.formGroup}>
            <label htmlFor="signup-confirm-password" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputWithError : ''}`}
              />
              <button
                type="button"
                className={styles.visibilityToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className={styles.fieldError}>
                <AlertCircle size={12} />
                <span>{fieldErrors.confirmPassword}</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Agreement */}
        <div className="mb-5">
          <label className={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => {
                setTermsAgreed(e.target.checked);
                if (fieldErrors.termsAgreed)
                  setFieldErrors((prev) => ({ ...prev, termsAgreed: '' }));
              }}
              className={styles.checkboxInput}
            />
            <span className="text-xs">
              I understand that preparation recommendations need my review before use.
            </span>
          </label>
          {fieldErrors.termsAgreed && (
            <div className={styles.fieldError}>
              <AlertCircle size={12} />
              <span>{fieldErrors.termsAgreed}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={styles.primaryButton}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating Kitchen Account...</span>
            </>
          ) : (
            <>
              <span>Complete Kitchen Registration</span>
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

      {/* Navigation */}
      <div className={styles.footerDivider}>
        <span>Already have an account?</span>
        <Link href="/login" className={styles.linkAccent}>
          Sign In Here →
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
