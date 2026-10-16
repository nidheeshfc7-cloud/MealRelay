'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('Sreenidhi Campus Dining');
  const [kitchenName, setKitchenName] = useState('Central Production Kitchen');
  const [capacity, setCapacity] = useState('1200');
  const [buffer, setBuffer] = useState('4.8');
  const [services, setServices] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
  });

  const handleFinish = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="bg-white border-b border-line-light py-4 px-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <Link href="/dashboard" className="text-xs font-bold text-ink-secondary hover:text-forest">
          Skip to Demo →
        </Link>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-forest uppercase tracking-widest">
              STEP {step} OF 3
            </span>
            <span className="text-xs font-bold text-ink-secondary">
              {step === 1 ? 'Organization Profile' : step === 2 ? 'Facility Configuration' : 'Forecasting Margins'}
            </span>
          </div>
          <div className="h-2 w-full bg-line-light rounded-full overflow-hidden flex gap-1">
            <div className={`h-full flex-1 rounded-full ${step >= 1 ? 'bg-forest' : 'bg-line-light'}`} />
            <div className={`h-full flex-1 rounded-full ${step >= 2 ? 'bg-forest' : 'bg-line-light'}`} />
            <div className={`h-full flex-1 rounded-full ${step >= 3 ? 'bg-forest' : 'bg-line-light'}`} />
          </div>
        </div>

        {/* Step Container */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-line-light">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-ink tracking-tight">Name your dining organization</h2>
                <p className="text-sm text-ink-secondary mt-1">
                  This tenant boundary separates all kitchen units, user access roles, and historical records.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-3.5 text-ink-secondary" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                    placeholder="e.g. Sreenidhi Hospitality Services"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-canvas border border-line-light text-xs text-ink-secondary">
                <span className="font-bold text-ink">Multi-Tenant Tenant Isolation:</span> Each organization is mapped to a dedicated Supabase Row-Level Security tenant ID.
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-xl bg-forest text-lime font-black text-sm hover:bg-forest-dark transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Continue to Facility Setup</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-ink tracking-tight">Setup primary production kitchen</h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Specify preparation volume, location, and operating capacity.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Kitchen Facility Name
                </label>
                <input
                  type="text"
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                  placeholder="e.g. Main Dining Complex Kitchen"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Max Daily Servings Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                  placeholder="1200"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3.5 rounded-xl border border-line-light text-ink font-bold text-sm hover:bg-canvas"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 rounded-xl bg-forest text-lime font-black text-sm hover:bg-forest-dark transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Continue to Forecasting</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-ink tracking-tight">Configure forecasting buffers</h2>
                <p className="text-sm text-ink-secondary mt-1">
                  Set safety tolerances to guarantee no student or guest meal shortages while minimizing leftover waste.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Recommended Protective Kitchen Buffer ({buffer}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.2"
                  value={buffer}
                  onChange={(e) => setBuffer(e.target.value)}
                  className="w-full accent-forest cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-ink-secondary mt-1">
                  <span>0% (Zero Slack)</span>
                  <span className="font-bold text-forest">{buffer}% (Institutional Standard)</span>
                  <span>10% (Maximum Headroom)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Active Meal Services
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'breakfast', name: 'Breakfast', time: '7:30 – 9:30 AM' },
                    { key: 'lunch', name: 'Lunch', time: '12:30 – 2:30 PM' },
                    { key: 'dinner', name: 'Dinner', time: '7:00 – 9:00 PM' },
                  ].map((s) => (
                    <div
                      key={s.key}
                      onClick={() =>
                        setServices({ ...services, [s.key]: !services[s.key as keyof typeof services] })
                      }
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                        services[s.key as keyof typeof services]
                          ? 'border-forest bg-forest/5 text-forest font-bold'
                          : 'border-line-light text-ink-secondary'
                      }`}
                    >
                      <p className="text-sm font-bold">{s.name}</p>
                      <p className="text-[10px] mt-0.5">{s.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3.5 rounded-xl border border-line-light text-ink font-bold text-sm hover:bg-canvas"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex-1 py-3.5 rounded-xl bg-forest text-lime font-black text-sm hover:bg-forest-dark transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Launch MealRelay Command Center</span>
                  <CheckCircle2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
