'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Database,
  Key,
  RefreshCw,
  Save,
  ShieldAlert,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useAccountIdentity } from '@/components/auth/AccountIdentity';

export default function SettingsPage() {
  const account = useAccountIdentity();
  const [kitchenName, setKitchenName] = useState(account.organization);
  const [orgName, setOrgName] = useState(account.organization);
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset demo state back to factory defaults?')) {
      setKitchenName(account.organization);
      setOrgName(account.organization);
      setNotifications(true);
      alert('Demo data restored to initial campus baseline.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Kitchen & Workspace Settings"
            subtitle="Dining Facility Configuration & Shared Monorepo Parameters"
          />

          {saved && (
            <div className="p-4 rounded-2xl bg-sage border border-line-light text-forest text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-forest" />
              <span>Workspace preferences saved successfully!</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 8 Cols: Editable Form */}
            <div className="lg:col-span-7 space-y-6">
              <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-white border border-line-light shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-black text-ink">Institutional Facility Info</h3>
                  <p className="text-xs sm:text-sm text-ink-secondary mt-1">
                    Updates kitchen labels across web dashboard cards and mobile dispatch screens.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                    Organization Tenant Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">
                    Production Kitchen Name
                  </label>
                  <input
                    type="text"
                    value={kitchenName}
                    onChange={(e) => setKitchenName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-line-light focus:outline-none focus:border-forest text-sm text-ink bg-canvas"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-canvas border border-line-light">
                  <div>
                    <p className="text-sm font-bold text-ink">Daily Forecast Notifications</p>
                    <p className="text-xs text-ink-secondary">Receive morning dispatch summaries before 6:30 AM</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-5 h-5 accent-forest cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-line-light">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl border border-line-light text-xs font-bold text-ink-secondary hover:text-ink hover:bg-canvas transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    <span>Restore Defaults</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-forest text-lime font-black text-sm hover:bg-forest-dark transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Save size={16} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>

              {/* Monorepo Architecture Reference */}
              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-forest">
                  <Smartphone size={18} />
                  <h4 className="text-sm font-black uppercase tracking-wider">Mobile App Pair</h4>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  The React Native Expo application in <code className="px-1.5 py-0.5 rounded bg-canvas text-ink font-mono text-[11px]">apps/mobile</code> shares
                  the identical <code className="px-1.5 py-0.5 rounded bg-canvas text-ink font-mono text-[11px]">@mealrelay/core</code> forecasting formulas and portion steps.
                </p>
              </div>

              {/* Cinematic Animation Experience */}
              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-forest">
                    <Sparkles size={18} />
                    <h4 className="text-sm font-black uppercase tracking-wider">Cinematic Intro Experience</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-black tracking-wider uppercase">
                    Stage 1 Active
                  </span>
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">
                  High-impact kinetic typography intro (&quot;Plan Smarter. Prepare Better. Waste Less.&quot;) rendered with Motion for React.
                </p>
                <div className="pt-1">
                  <Link
                    href="/?intro=replay"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-lime text-xs font-black hover:bg-forest-dark transition-all active:scale-95 shadow-sm"
                  >
                    <span>Replay Cinematic Intro</span>
                    <RefreshCw size={13} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Backend Integration Guide */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-forest text-white border border-line-dark shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-lime">
                  <Database size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Supabase Backend Integration</h4>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  To transition from local in-memory demo mode to a live PostgreSQL backend with real-time multi-tenant sync:
                </p>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-forest-dark/80 border border-white/10">
                    <p className="font-bold text-white mb-1">1. Database Migration</p>
                    <p className="text-white/60">
                      Apply the schema and RLS policies from <code className="text-lime font-mono">packages/api/schema.sql</code> in your Supabase SQL Editor.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-forest-dark/80 border border-white/10">
                    <p className="font-bold text-white mb-1">2. Environment Credentials</p>
                    <p className="text-white/60">
                      Create <code className="text-lime font-mono">apps/web/.env.local</code> with:
                    </p>
                    <pre className="mt-1.5 p-2 rounded bg-black/40 text-[10px] text-lime font-mono overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-forest-dark/80 border border-white/10">
                    <p className="font-bold text-white mb-1">3. Tenant Isolation</p>
                    <p className="text-white/60">
                      Row-Level Security automatically scopes records using <code className="text-lime font-mono">auth.uid()</code> and <code className="text-lime font-mono">org_id</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
