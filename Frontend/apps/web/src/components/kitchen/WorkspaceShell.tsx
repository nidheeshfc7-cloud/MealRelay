"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ClipboardList, ChefHat } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface WorkspaceShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const WORKSPACE_TABS = [
  {
    label: "Daily Records & Activity",
    href: "/records",
    Icon: ClipboardList,
  },
  {
    label: "Menu Management",
    href: "/menu",
    Icon: UtensilsCrossed,
  },
  {
    label: "Cooking Plan",
    href: "/dashboard",
    Icon: ChefHat,
  },
] as const;

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  title,
  description,
  children,
}) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col lg:flex-row font-sans selection:bg-lime selection:text-forest-dark">
      <Sidebar />
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage text-forest text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-forest animate-pulse" />
            <span>Kitchen Operations Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-ink-secondary max-w-3xl font-medium leading-relaxed">
            {description}
          </p>
        </header>

        {/* Cohesive Workflow Segmented Bar */}
        <nav
          aria-label="Kitchen workflows"
          className="flex items-center gap-2 flex-wrap border-b border-line-light pb-4"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const TabIcon = tab.Icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-all ${
                  isActive
                    ? "bg-forest text-lime border-forest font-bold shadow-xs"
                    : "bg-white border-line-light text-ink-secondary hover:text-ink hover:bg-canvas font-semibold"
                }`}
              >
                <TabIcon size={16} className={isActive ? "text-lime" : "text-ink-secondary"} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {children}
      </main>
    </div>
  );
};

