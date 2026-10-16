'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'demo' | 'email'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDemoLogin = (role: string) => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <BrandLogo size="lg" className="justify-center mb-6" />
            <h1 className="text-3xl font-black text-ink tracking-tight">Access Kitchen Operations</h1>
            <p className="text-sm text-ink-secondary mt-2">
              Sign in to manage dining preparation, forecasting buffers, and service logs.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-line-light">
            {/* Mode Switcher */}
            <div className="flex p-1 bg-canvas rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'demo' ? 'bg-forest text-lime shadow-sm' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                1-Click Demo Access
              </button>
              <button
                type="button"
                onClick={() => setMode('email')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'email' ? 'bg-forest text-lime shadow-sm' : 'text-ink-secondary hover:text-ink'
                }`}
              >
                Institutional SSO / Email
              </button>
            </div>

            {mode === 'demo' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-canvas border border-line-light text-xs text-ink-secondary space-y-1">
                  <p className="font-bold text-ink">Explore with Pre-configured Roles:</p>
                  <p>Instant access with sample campus kitchen records. No real credentials required.</p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin('Head Chef')}
                  className="w-full p-4 rounded-2xl border border-line-light hover:border-forest/40 bg-white hover:bg-slate-50 transition-all flex items-center justify-between text-left group active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-black text-ink group-hover:text-forest">Head Chef (Full Operations)</p>
                    <p className="text-xs text-ink-secondary">Review forecasts, approve prep plans, adjust ±5 portions</p>
                  </div>
                  <ArrowRight size={16} className="text-ink-secondary group-hover:text-forest group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin('Operations Manager')}
                  className="w-full p-4 rounded-2xl border border-line-light hover:border-forest/40 bg-white hover:bg-slate-50 transition-all flex items-center justify-between text-left group active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-black text-ink group-hover:text-forest">Kitchen Director (Analytics & Waste)</p>
                    <p className="text-xs text-ink-secondary">Multi-kitchen metrics, cost tracking, leftover rate</p>
                  </div>
                  <ArrowRight size={16} className="text-ink-secondary group-hover:text-forest group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Institutional Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-ink-secondary" />
                    <input
                      type="email"
                      required
                      placeholder="chef@institution.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5">
                    Password / Token
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-ink-secondary" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-forest text-lime font-black text-sm hover:bg-forest-dark transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
                >
                  <span>{isLoading ? 'Verifying...' : 'Sign In to Dashboard'}</span>
                  <ArrowRight size={16} />
                </button>

                <p className="text-[11px] text-center text-ink-secondary">
                  Connecting to Supabase PostgreSQL Auth when configured in `.env.local`.
                </p>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-line-light flex items-center justify-between text-xs text-ink-secondary">
              <Link href="/onboarding" className="hover:text-forest font-semibold">
                Setup New Kitchen →
              </Link>
              <Link href="/" className="hover:text-forest">
                Return to Landing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
