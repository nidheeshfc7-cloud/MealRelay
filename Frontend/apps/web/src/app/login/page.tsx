import React from 'react';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | MealRelay Operations',
  description: 'Access dining preparation, forecasting buffers, and surplus redistributions.',
};

export default function LoginPage() {
  return (
    <AuthCard
      badgeText="Operational Access"
      title="Kitchen Operations Sign In"
      subtitle="Access dining preparation, forecasting buffers, and institutional surplus logs."
    >
      <LoginForm />
    </AuthCard>
  );
}
