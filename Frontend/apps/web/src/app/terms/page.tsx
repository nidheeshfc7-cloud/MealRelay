import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms & Conditions — MealRelay",
  description:
    "Operational guidelines, forecasting boundaries, and kitchen supervisor responsibilities for the MealRelay platform.",
};

interface TermSection {
  title: string;
  paragraphs: string[];
}

const SECTIONS: TermSection[] = [
  {
    title: "1. Scope & Purpose",
    paragraphs: [
      "MealRelay provides institutional kitchens and hostel messes with demand forecasting tools to help teams plan preparation and reduce avoidable food surplus (aligned with UN Sustainable Development Goal 12: Responsible Consumption and Production).",
      "The platform is strictly an operational decision aid. It does not automatically order supplies, cook food, or enforce preparation quotas.",
    ],
  },
  {
    title: "2. Kitchen Manager Authority",
    paragraphs: [
      "All predictive figures, safety buffers, and portion recommendations are advisory. Kitchen managers, head chefs, and mess supervisors retain 100% final authority over all cooking, procurement, and portioning decisions.",
      "Kitchen operators are expected to review, adjust, and confirm all suggested quantities based on their real-time operational context before cooking begins. MealRelay never overrides human culinary judgment.",
    ],
  },
  {
    title: "3. Forecasting Boundaries & Limitations",
    paragraphs: [
      "Demand forecasts are statistical approximations calculated from historical consumption records, attendance trends, and day-of-week patterns. Because student turnout fluctuates naturally due to exams, weather, and campus events, MealRelay cannot guarantee zero food surplus or absolute shortage elimination.",
      "Any projected waste reduction or food-cost improvements are operational targets that depend on kitchen execution and must be verified through real-world pilot measurement.",
    ],
  },
  {
    title: "4. Kitchen Records & Privacy",
    paragraphs: [
      "Data entered by your facility—including prepared portions, served counts, leftovers, and headcount—is processed solely to calibrate and train predictive models for your kitchen.",
      "We do not sell, rent, or commercialize your kitchen's operational records, nor do we disclose identifiable facility data to third parties.",
    ],
  },
  {
    title: "5. Food Safety & Regulatory Compliance",
    paragraphs: [
      "Participating kitchens remain solely responsible for ensuring that all food handling, storage, temperature management, and surplus redistribution practices comply with applicable local health regulations and institutional food safety standards.",
      "Nutritional safety floors and portion targets provided by the system are secondary planning aids and do not substitute for certified dietary guidelines.",
    ],
  },
  {
    title: "6. Limitation of Liability",
    paragraphs: [
      "MealRelay is provided on an 'as is' and 'as available' basis. To the maximum extent permitted by applicable law, MealRelay, its creators, and affiliated contributors disclaim liability for any operational disruptions, food shortages, surplus spoilage, or associated expenses resulting from reliance on predictive suggestions.",
    ],
  },
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans selection:bg-lime selection:text-forest-dark">
      {/* Quiet Top Navigation */}
      <header className="border-b border-line-light bg-canvas/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <BrandLogo size="md" />
          <Link
            href="/"
            className="text-sm font-semibold text-ink-secondary hover:text-ink flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Editorial Article */}
      <main className="flex-1 max-w-2xl mx-auto px-6 py-14 sm:py-20 w-full">
        {/* Title Header */}
        <div className="pb-8 mb-12 border-b border-line-light">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
            Operational Guidelines
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-ink-secondary mt-2">
            Effective Date: October 19, 2026 · Version 1.0 (MVP)
          </p>
        </div>

        {/* Prose Sections */}
        <div className="space-y-10 sm:space-y-12">
          {SECTIONS.map((section, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-ink">
                {section.title}
              </h2>
              <div className="space-y-3 text-sm sm:text-base leading-relaxed text-ink-secondary">
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
};

export default TermsPage;
