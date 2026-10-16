import React from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

interface FooterLinkItem {
  label: string;
  href: string;
}

const FOOTER_LINKS: FooterLinkItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Planner", href: "/planner" },
  { label: "Forecasts", href: "/forecasts" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-line-light py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <BrandLogo size="md" />

        <div className="flex items-center gap-6 text-xs text-ink-secondary font-semibold">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-forest transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-ink-secondary">
          © 2026 MealRelay. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
