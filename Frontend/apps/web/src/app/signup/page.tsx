import React from 'react';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { SignupForm } from '@/components/auth/SignupForm';

export const metadata: Metadata = {
  title: 'Create Kitchen Workspace | MealRelay',
  description: 'Register your institutional kitchen, dining hall, or food recovery team on MealRelay.',
};

export default function SignupPage() {
  return (
    <AuthCard
      badgeText="Workspace Setup"
      title="Create Facility Account"
      subtitle="Register your dining hall or food recovery network to start forecasting portions."
    >
      <SignupForm />
    </AuthCard>
  );
}
