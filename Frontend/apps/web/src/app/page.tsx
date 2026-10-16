import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Database,
  Flame,
  Globe,
  Check,
  Leaf,
  Layers,
  LineChart,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { DemoBanner } from "@/components/DemoBanner";
import { CinematicIntro } from "@/components/CinematicIntro";
import {
  DEFAULT_MEALS,
  SAMPLE_METRICS,
  formatPortionNumber,
} from "@mealrelay/core";
import Footer from "@/components/footer";

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
            <a href="#workflow" className="hover:text-forest transition-colors">
              How It Works
            </a>
            <a href="#radar" className="hover:text-forest transition-colors">
              Forecasting Engine
            </a>
            <a
              href="#architecture"
              className="hover:text-forest transition-colors"
            >
              Cross-Platform Stack
            </a>
            <Link
              href="/analytics"
              className="hover:text-forest transition-colors"
            >
              Analytics
            </Link>
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
                Every meal planned.{" "}
                <span className="text-forest underline decoration-lime decoration-4 underline-offset-8">
                  Less wasted.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-ink-secondary max-w-xl font-normal leading-relaxed">
                Predict demand before the first ingredient hits the pan. An
                institutional dining operations platform connecting forecasting,
                prep work orders, and closed-loop waste intelligence.
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
                  <p className="text-2xl sm:text-3xl font-black text-forest">
                    94.2%
                  </p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">
                    Service Rate Accuracy
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-forest">
                    ~24.6%
                  </p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">
                    Food Waste Cut
                  </p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-forest">
                    +4.8%
                  </p>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">
                    Calibrated Buffer
                  </p>
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
                    {/* <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime"></span>
                    </span> */}
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-lime">
                        LIVE FORECAST RADAR
                      </p>
                      <p className="text-sm font-bold text-white">
                        Tomorrow's Planned Prep
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-lime/20 text-lime border border-lime/30">
                    BUFFER +4.8%
                  </span>
                </div>

                {/* Big Metric Display */}
                <div className="py-6">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                    Total Planned Servings
                  </p>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-5xl font-black tracking-tight text-white">
                      {formatPortionNumber(totalPortions)}
                    </span>
                    <span className="text-lime text-base font-bold">
                      portions
                    </span>
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
                          <span className="text-lime">
                            {meal.base} servings
                          </span>
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
                  <span className="text-xs text-white/60">
                    Institutional Kitchen A
                  </span>
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

      {/* How It Works / Workflow Section */}
      <section
        className="py-20 bg-forest text-white border-y border-line-dark"
        id="workflow"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-lime">
                FROM FORECAST TO FOLLOW-THROUGH
              </p>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
                One rhythm. Every service.
              </h2>
            </div>
            <p className="text-white/70 text-base sm:text-lg max-w-md font-normal leading-relaxed">
              A recommendation is a starting point. The manager makes the final
              call.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Predict",
                description:
                  "Review the sample baseline. Explore a buffer and see the additional portions before making a decision.",
                Icon: LineChart,
                href: "/forecasts",
                action: "Explore forecasts",
              },
              {
                number: "02",
                title: "Prepare",
                description:
                  "Fine-tune breakfast, lunch and dinner quantities. Confirm the total and approve your reviewed plan.",
                Icon: Utensils,
                href: "/planner",
                action: "Open meal planner",
              },
              {
                number: "03",
                title: "Improve",
                description:
                  "Read the prepared-versus-served breakdown. Use the sample leftovers to understand the planning gap.",
                Icon: Leaf,
                href: "/analytics",
                action: "Read service analytics",
              },
            ].map(({ number, title, description, Icon, href, action }) => (
              <article
                key={number}
                className="p-8 rounded-2xl bg-forest-dark/70 border border-white/10 hover:border-lime/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <span className="text-xs font-mono font-bold tracking-widest text-lime">
                      {number}
                    </span>
                    <Icon
                      size={22}
                      className="text-lime/80 group-hover:text-lime group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3">
                    {title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed font-normal mb-8">
                    {description}
                  </p>
                </div>

                <Link
                  href={href}
                  className="inline-flex items-center gap-2 text-sm font-bold text-lime hover:text-lime-soft transition-colors group-hover:translate-x-1"
                >
                  <span>{action}</span>
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-20 sm:py-28 bg-canvas border-t border-line-light relative overflow-hidden">
        {/* Soft decorative background accents */}
        <div className="absolute -left-20 bottom-0 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-lime/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* The Problem Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-line-light/90 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-5 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FEECEB] flex items-center justify-center flex-shrink-0 text-[#F05252]">
                  <BarChart3
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    strokeWidth={2.4}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                    The Problem
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary mt-2 leading-relaxed">
                    Institutions often rely on guesswork, leading to
                    overproduction, food waste, and higher costs.
                  </p>
                  <ul className="mt-6 sm:mt-8 space-y-3.5">
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#EB5757] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Unpredictable demand</span>
                    </li>
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#EB5757] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Excess food waste</span>
                    </li>
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#EB5757] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Inefficient labor and higher costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* The Solution Card */}
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-line-light/90 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-5 sm:gap-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EAF8E6] flex items-center justify-center flex-shrink-0 text-[#2B8A3E]">
                  <Leaf className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                    The Solution
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary mt-2 leading-relaxed">
                    MealRelay brings data-driven forecasting and real-time
                    insights to help you prepare the right amount, reduce waste,
                    and operate more efficiently.
                  </p>
                  <ul className="mt-6 sm:mt-8 space-y-3.5">
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#37B24D] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Accurate demand forecasting</span>
                    </li>
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#37B24D] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Optimized prep plans and work orders</span>
                    </li>
                    <li className="flex items-center gap-3.5 text-sm sm:text-base font-semibold text-ink">
                      <span className="w-5 h-5 rounded-full bg-[#37B24D] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      <span>Continuous improvement through real data</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Platform Architecture Section */}
      <section className="py-20 bg-forest text-white" id="architecture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-lime">
              CROSS-PLATFORM ENGINEERING
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
              One Unified Engine.{"\n"}Web & Native Mobile.
            </h2>
            <p className="text-white/70 text-base sm:text-lg mt-4">
              A single monorepo powering both our desktop command center and
              kitchen handheld terminals. Zero business logic divergence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Next.js Web",
                icon: Globe,
                badge: "Desktop & Mobile Web",
                desc: "Next.js 14 App Router, TypeScript, Tailwind CSS with multi-column planning tools.",
              },
              {
                title: "Expo React Native",
                icon: Smartphone,
                badge: "iOS & Android Native",
                desc: "High-performance React Native app for chefs and operations teams on mobile devices.",
              },
              {
                title: "Shared Core Engine",
                icon: Layers,
                badge: "@mealrelay/core",
                desc: "Framework-independent TypeScript functions for demand forecasting and waste measurement.",
              },
              {
                title: "Supabase Architecture",
                icon: Database,
                badge: "PostgreSQL + RLS",
                desc: "Multi-tenant database schema with Row-Level Security ensuring absolute tenant data isolation.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-forest-dark/80 border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-lime/15 text-lime flex items-center justify-center mb-4">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-lime tracking-wider uppercase">
                      {item.badge}
                    </span>
                    <h3 className="text-lg font-black text-white mt-1 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <Footer />
    </div>
  );
}
