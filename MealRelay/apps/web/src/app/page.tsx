import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Database,
  Flame,
  Globe,
  Leaf,
  Layers,
  LineChart,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { DemoBanner } from '@/components/DemoBanner';
import { CinematicIntro } from '@/components/CinematicIntro';
import { DEFAULT_MEALS, SAMPLE_METRICS, formatPortionNumber } from '@mealrelay/core';

export default function LandingPage() {
  const totalPortions = DEFAULT_MEALS.reduce((acc, m) => acc + m.base, 0);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col relative">
      <CinematicIntro />
      <DemoBanner />

      {/* Top Professional Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-line-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <BrandLogo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-ink-secondary">
            <a href="#workflow" className="hover:text-forest transition-colors">How It Works</a>
            <a href="#radar" className="hover:text-forest transition-colors">Forecasting Engine</a>
            <a href="#architecture" className="hover:text-forest transition-colors">Cross-Platform Stack</a>
            <Link href="/analytics" className="hover:text-forest transition-colors">Analytics</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-canvas text-ink transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm font-extrabold px-5 py-2.5 rounded-xl bg-forest text-lime hover:bg-forest-dark transition-all active:scale-95 shadow-sm flex items-center gap-2"
            >
              <span>Explore Demo</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 bg-gradient-to-b from-white via-canvas to-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Editorial Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest text-lime text-xs font-extrabold tracking-wider uppercase border border-forest-dark shadow-sm">
                <Sparkles size={13} />
                <span>The Smarter Kitchen Era</span>
              </div>

              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-ink tracking-tight leading-[1.05]">
                Every meal planned.{' '}
                <span className="text-forest underline decoration-lime decoration-4 underline-offset-8">
                  Less wasted.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-ink-secondary max-w-xl font-normal leading-relaxed">
                Predict demand before the first ingredient hits the pan. An institutional dining operations platform
                connecting forecasting, prep work orders, and closed-loop waste intelligence.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/dashboard"
                  className="px-8 py-4 rounded-2xl bg-forest text-lime font-black text-base hover:bg-forest-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-forest/15 active:scale-95"
                >
                  <span>Explore the Dashboard</span>
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/planner"
                  className="px-8 py-4 rounded-2xl bg-white border border-line-light text-ink font-bold text-base hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                >
                  <span>See How It Works</span>
                  <ChevronRight size={18} className="text-ink-secondary" />
                </Link>
              </div>

              {/* Micro Metrics Strip */}
              <div className="pt-6 border-t border-line-light grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-forest">94.2%</p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">Service Rate Accuracy</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-forest">~24.6%</p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">Food Waste Cut</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-forest">+4.8%</p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">Calibrated Buffer</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Kitchen Radar Interactive Preview Card */}
            <div className="lg:col-span-5" id="radar">
              <div className="bg-forest rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-line-dark relative overflow-hidden">
                {/* Background ambient lighting */}
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-lime/10 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime"></span>
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime">LIVE FORECAST RADAR</p>
                      <p className="text-sm font-bold text-white">Tomorrow's Planned Prep</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-lime/20 text-lime border border-lime/30">
                    BUFFER +4.8%
                  </span>
                </div>

                {/* Big Metric Display */}
                <div className="py-6">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Total Planned Servings</p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-5xl font-black tracking-tight text-white">{formatPortionNumber(totalPortions)}</span>
                    <span className="text-lime text-base font-bold">portions</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1">
                    Distributed across Breakfast, Lunch, and Dinner
                  </p>
                </div>

                {/* Service Bars breakdown */}
                <div className="space-y-4 pt-2">
                  {DEFAULT_MEALS.map((meal) => {
                    const ratio = Math.round((meal.base / 264) * 100);
                    return (
                      <div key={meal.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white/90">{meal.name}</span>
                          <span className="text-lime">{meal.base} servings</span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-lime rounded-full transition-all duration-1000"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-white/50">
                          <span>{meal.period}</span>
                          <span>Prev: {meal.actual}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-white/60">Institutional Kitchen A</span>
                  <Link
                    href="/planner"
                    className="text-xs font-black text-lime hover:underline flex items-center gap-1"
                  >
                    <span>Adjust Portions</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white border-y border-line-light" id="workflow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-forest">THE CLOSED-LOOP WORKFLOW</span>
            <h2 className="text-3xl sm:text-5xl font-black text-ink tracking-tight mt-2">
              Less guessing. More impact.
            </h2>
            <p className="text-base sm:text-lg text-ink-secondary mt-4">
              Institutional dining waste happens because portions are planned in spreadsheets using gut feel.
              MealRelay turns past dining data into actionable daily prep orders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Predict Demand',
                icon: LineChart,
                desc: 'Considers headcount, historical attendance, seasonality, and campus calendar patterns to forecast actual portions required.',
              },
              {
                step: '02',
                title: 'Prepare with Buffer',
                icon: Utensils,
                desc: 'Recommends prep quantities with a custom safety margin (default +4.8%). Chefs retain full manual control in steps of 5 servings.',
              },
              {
                step: '03',
                title: 'Measure & Improve',
                icon: Leaf,
                desc: 'Logs meals served and leftover trays after service. Closes the feedback loop so each subsequent forecast is sharper than the last.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.step}
                  className="p-8 rounded-3xl bg-canvas border border-line-light hover:border-forest/30 transition-all hover:shadow-lg group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-forest text-lime flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-black tracking-widest text-forest">STEP {card.step}</span>
                  <h3 className="text-xl font-black text-ink mt-2 mb-3">{card.title}</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cross-Platform Architecture Section */}
      <section className="py-20 bg-forest text-white" id="architecture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-lime">CROSS-PLATFORM ENGINEERING</span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
              One Unified Engine.{'\n'}Web & Native Mobile.
            </h2>
            <p className="text-white/70 text-base sm:text-lg mt-4">
              A single monorepo powering both our desktop command center and kitchen handheld terminals.
              Zero business logic divergence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Next.js Web',
                icon: Globe,
                badge: 'Desktop & Mobile Web',
                desc: 'Next.js 14 App Router, TypeScript, Tailwind CSS with multi-column planning tools.',
              },
              {
                title: 'Expo React Native',
                icon: Smartphone,
                badge: 'iOS & Android Native',
                desc: 'High-performance React Native app for chefs and operations teams on mobile devices.',
              },
              {
                title: 'Shared Core Engine',
                icon: Layers,
                badge: '@mealrelay/core',
                desc: 'Framework-independent TypeScript functions for demand forecasting and waste measurement.',
              },
              {
                title: 'Supabase Architecture',
                icon: Database,
                badge: 'PostgreSQL + RLS',
                desc: 'Multi-tenant database schema with Row-Level Security ensuring absolute tenant data isolation.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-forest-dark/80 border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-lime/15 text-lime flex items-center justify-center mb-4">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-lime tracking-wider uppercase">{item.badge}</span>
                    <h3 className="text-lg font-black text-white mt-1 mb-2">{item.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <footer className="mt-auto bg-white border-t border-line-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <BrandLogo size="md" />

          <div className="flex items-center gap-6 text-xs text-ink-secondary font-semibold">
            <Link href="/dashboard" className="hover:text-forest">Dashboard</Link>
            <Link href="/planner" className="hover:text-forest">Planner</Link>
            <Link href="/forecasts" className="hover:text-forest">Forecasts</Link>
            <Link href="/analytics" className="hover:text-forest">Analytics</Link>
            <Link href="/settings" className="hover:text-forest">Settings</Link>
          </div>

          <p className="text-xs text-ink-secondary">
            © 2026 MealRelay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
