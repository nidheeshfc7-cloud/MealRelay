"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  LineChart,
  Menu,
  Pin,
  SlidersHorizontal,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meal Planner", href: "/planner", icon: CalendarRange },
  { label: "Demand Forecasts", href: "/forecasts", icon: LineChart },
  { label: "Waste Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Kitchen Settings", href: "/settings", icon: SlidersHorizontal },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Load pinned preference from localStorage on mount
  useEffect(() => {
    try {
      const savedPin = localStorage.getItem("mealrelay_sidebar_pinned");
      if (savedPin !== null) {
        setIsPinned(savedPin === "true");
      }
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mealrelay_sidebar_pinned", String(next));
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  };

  const isExpanded = isPinned || isHovered;

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
                <p className="text-white/50 uppercase font-semibold text-[10px] tracking-wider">
                  Active Facility
                </p>
                <p className="text-white font-bold truncate mt-0.5">
                  Sreenidhi Campus Kitchen
                </p>
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
                          ? "bg-lime text-forest-dark shadow-sm"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={
                          active ? "text-forest-dark" : "text-white/60"
                        }
                      />
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

      {/* Desktop Responsive Hover/Pinned Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex flex-col justify-between bg-forest text-white border-r border-line-dark h-screen sticky top-0 shrink-0 select-none px-3.5 py-5 overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isExpanded ? "w-[260px]" : "w-[72px]"
        }`}
      >
        <div>
          {/* Header: Logo and Sticky Pin Button */}
          <div className="flex items-center h-11 mb-6 relative">
            <Link
              href="/"
              className="flex items-center gap-2.5 shrink-0 group active:scale-95"
            >
              <div className="w-11 h-11 rounded-xl bg-lime text-forest-dark flex items-center justify-center -rotate-6 shadow-sm shrink-0 transition-transform">
                <Leaf size={20} className="stroke-[2.5]" />
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded
                    ? "opacity-100 max-w-[130px] translate-x-0"
                    : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                }`}
              >
                <span className="font-black tracking-tight text-xl text-white whitespace-nowrap">
                  mealrelay<span className="text-lime">.</span>
                </span>
              </div>
            </Link>

            <button
              onClick={togglePin}
              type="button"
              title={
                isPinned
                  ? "Unpin sidebar (collapse on hover off)"
                  : "Pin sidebar open (always visible)"
              }
              className={`ml-auto p-2 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shrink-0 ${
                isExpanded
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-75 pointer-events-none"
              } ${
                isPinned
                  ? "bg-lime text-forest-dark shadow-sm hover:bg-lime-soft"
                  : "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              }`}
              aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin
                size={16}
                className={`transition-transform duration-200 ${isPinned ? "rotate-45" : ""}`}
              />
            </button>
          </div>

          {/* Active Facility Widget */}
          <div
            className={`mb-6 rounded-2xl bg-forest-dark/70 border border-white/10 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded ? "p-3.5 h-[104px]" : "p-0 h-11 w-11"
            }`}
            title={
              !isExpanded
                ? "Active Facility: Sreenidhi Campus Kitchen (+4.8% buffer)"
                : undefined
            }
          >
            {isExpanded ? (
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">
                    FACILITY
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime"></span>
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1 truncate">
                  Sreenidhi Campus Kitchen
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed size={12} className="text-lime" /> 3
                    Services
                  </span>
                  <span className="font-semibold text-lime">+4.8% buffer</span>
                </div>
              </div>
            ) : (
              <div className="w-11 h-11 flex items-center justify-center relative">
                <UtensilsCrossed size={18} className="text-lime" />
                <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-lime"></span>
                </span>
              </div>
            )}
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
                  title={!isExpanded ? item.label : undefined}
                  className={`group flex items-center h-11 rounded-xl text-sm font-bold transition-all duration-200 ${
                    active
                      ? "bg-lime text-forest-dark shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                    <Icon
                      size={20}
                      className={`transition-colors duration-150 ${
                        active
                          ? "text-forest-dark"
                          : "text-white/60 group-hover:text-white"
                      }`}
                    />
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isExpanded
                        ? "opacity-100 max-w-[170px] translate-x-0"
                        : "opacity-0 max-w-0 -translate-x-2 pointer-events-none"
                    }`}
                  >
                    <span className="whitespace-nowrap pr-3 truncate block">
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Account */}
        <div className="border-t border-white/10 pt-3.5 mt-auto flex items-center">
          <div
            className="w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full shrink-0 bg-lime/20 border border-lime/40 text-lime font-bold text-xs flex items-center justify-center select-none"
            title="Campus Chef (chef@sreenidhi.edu)"
          >
            SC
          </div>

          <div
            className={`flex items-center justify-between flex-1 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded
                ? "opacity-100 max-w-[170px] ml-3 translate-x-0"
                : "opacity-0 max-w-0 ml-0 -translate-x-2 pointer-events-none"
            }`}
          >
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                Campus Chef
              </p>
              <p className="text-[10px] text-white/50 truncate max-w-[110px]">
                chef@sreenidhi.edu
              </p>
            </div>
            <Link
              href="/settings"
              className="p-1.5 rounded-lg text-white/40 hover:text-lime hover:bg-white/10 transition-colors shrink-0 ml-2"
              title="Settings"
            >
              <SlidersHorizontal size={15} />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};
