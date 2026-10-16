'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  Flame,
  LayoutDashboard,
  LineChart,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Meal Planner', href: '/planner', icon: CalendarRange },
  { label: 'Demand Forecasts', href: '/forecasts', icon: LineChart },
  { label: 'Waste Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Kitchen Settings', href: '/settings', icon: SlidersHorizontal },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Header with Hamburger */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-forest text-white border-b border-line-dark sticky top-0 z-40">
        <BrandLogo light size="sm" />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs h-full bg-forest-dark p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <BrandLogo light size="md" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Kitchen Badge */}
              <div className="mb-6 p-3 rounded-xl bg-forest/60 border border-white/10 text-xs">
                <p className="text-white/50 uppercase font-semibold text-[10px] tracking-wider">Active Facility</p>
                <p className="text-white font-bold truncate mt-0.5">Sreenidhi Campus Kitchen</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-lime/20 text-lime border border-lime/30">
                  Buffer +4.8% Active
                </span>
              </div>

              {/* Links */}
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-lime text-forest-dark shadow-sm'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={18} className={active ? 'text-forest-dark' : 'text-white/60'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-white/10 pt-4">
              <Link
                href="/login"
                className="flex items-center justify-between text-xs text-white/60 hover:text-white transition-colors"
              >
                <span>Switch Organization</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between bg-forest text-white border-r border-line-dark h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <div className="mb-8">
            <BrandLogo light size="lg" />
          </div>

          {/* Active Facility Card */}
          <div className="mb-7 p-3.5 rounded-2xl bg-forest-dark/80 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">FACILITY</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime"></span>
              </span>
            </div>
            <p className="text-sm font-bold text-white mt-1 truncate">Sreenidhi Campus Kitchen</p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/70">
              <span className="flex items-center gap-1">
                <UtensilsCrossed size={12} className="text-lime" /> 3 Services
              </span>
              <span className="font-semibold text-lime">+4.8% buffer</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    active
                      ? 'bg-lime text-forest-dark shadow-sm translate-x-1'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-forest-dark' : 'text-white/50'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10 bg-forest-dark/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-lime/20 border border-lime/40 text-lime font-bold text-xs flex items-center justify-center">
                SC
              </div>
              <div>
                <p className="text-xs font-bold text-white">Campus Chef</p>
                <p className="text-[10px] text-white/50 truncate max-w-[110px]">chef@sreenidhi.edu</p>
              </div>
            </div>
            <Link href="/settings" className="text-white/40 hover:text-lime transition-colors" title="Settings">
              <SlidersHorizontal size={16} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
