"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  ExternalLink,
  Flame,
  HelpCircle,
  Info,
  LayoutGrid,
  Leaf,
  List,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ResizableLayout } from "@/components/ResizableLayout";

type MealShiftKey = "breakfast" | "lunch" | "dinner";
type ViewDensity = "cards" | "compact";

interface DishItem {
  id: string;
  name: string;
  category: string;
  expectedEaters: number;
  manualOffset: number;
  unit: string;
  isPopularFavorite: boolean;
  modelType: "ai" | "baseline";
  reasons: string[];
}

interface ShiftMeta {
  key: MealShiftKey;
  label: string;
  timeWindow: string;
  expectedHeadcount: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SHIFT_CONFIGS: ShiftMeta[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    timeWindow: "7:30 – 9:30 AM",
    expectedHeadcount: 135,
    icon: Coffee,
  },
  {
    key: "lunch",
    label: "Lunch",
    timeWindow: "12:30 – 2:30 PM",
    expectedHeadcount: 185,
    icon: Sun,
  },
  {
    key: "dinner",
    label: "Dinner",
    timeWindow: "7:30 – 9:45 PM",
    expectedHeadcount: 170,
    icon: Moon,
  },
];

const BUFFER_PRESETS = [
  { value: 0.05, label: "+5%", title: "Tight", desc: "Best for calm weekdays" },
  { value: 0.08, label: "+8%", title: "Balanced", desc: "Recommended for Sundays" },
  { value: 0.1, label: "+10%", title: "Safe", desc: "Higher cushion for exams" },
  { value: 0.15, label: "+15%", title: "Extra Safe", desc: "For heavy rain or campus events" },
];

const INITIAL_DISH_DATA: Record<MealShiftKey, DishItem[]> = {
  breakfast: [
    {
      id: "d_idli",
      name: "Idli & Sambar",
      category: "Steamed Main",
      expectedEaters: 110,
      manualOffset: 0,
      unit: "plates",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "135 students expected for breakfast tomorrow morning",
        "Sunday mornings typically see ~18% lower turnout as students wake up later",
        "Extra cushion safely handles student second-helpings",
      ],
    },
    {
      id: "d_poha",
      name: "Indori Poha",
      category: "Light Main",
      expectedEaters: 95,
      manualOffset: 0,
      unit: "plates",
      isPopularFavorite: false,
      modelType: "ai",
      reasons: [
        "Popular weekend breakfast staple paired with tea",
        "Attendance steady across the last 4 Sunday mornings",
        "Fast to replenish if attendance surges unexpectedly",
      ],
    },
    {
      id: "d_dosa",
      name: "Masala Dosa",
      category: "Griddle Special",
      expectedEaters: 125,
      manualOffset: 0,
      unit: "servings",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "Highest demand breakfast dish on campus weekends",
        "88% of attending students choose dosa when offered",
        "Extra cushion prevents kitchen rush at peak 8:45 AM window",
      ],
    },
    {
      id: "d_tea",
      name: "Masala Chai & Filter Coffee",
      category: "Beverage",
      expectedEaters: 130,
      manualOffset: 0,
      unit: "cups",
      isPopularFavorite: false,
      modelType: "baseline",
      reasons: [
        "Nearly every breakfast student takes a hot beverage",
        "Consistent 0.95 cups per attending student historical average",
      ],
    },
  ],
  lunch: [
    {
      id: "d_paneer_lunch",
      name: "Paneer Butter Masala",
      category: "Main Curry",
      expectedEaters: 154,
      manualOffset: 0,
      unit: "plates",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "185 students expected for Sunday lunch service",
        "Campus favorite: 83% of dining hall students pick paneer on weekends",
        "Safety cushion prevents running out before the 2:00 PM late rush",
      ],
    },
    {
      id: "d_dal_tadka",
      name: "Yellow Dal Tadka",
      category: "Dal & Lentils",
      expectedEaters: 162,
      manualOffset: 0,
      unit: "bowls",
      isPopularFavorite: false,
      modelType: "ai",
      reasons: [
        "Essential staple consumed alongside rice and rotis",
        "Stable daily consumption pattern with minimal leftover variance",
      ],
    },
    {
      id: "d_rice_lunch",
      name: "Steamed Basmati Rice",
      category: "Rice Staple",
      expectedEaters: 175,
      manualOffset: 0,
      unit: "portions",
      isPopularFavorite: false,
      modelType: "ai",
      reasons: [
        "High volume lunch staple across all hostel wings",
        "Slightly higher intake on weekends during leisurely dining hours",
      ],
    },
    {
      id: "d_roti_lunch",
      name: "Fresh Phulka Roti",
      category: "Fresh Breads",
      expectedEaters: 390,
      manualOffset: 0,
      unit: "pieces",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "Average of 2.2 rotis per attending student for lunch",
        "Freshly made on tawa; easy to pace during the service window",
      ],
    },
    {
      id: "d_curd",
      name: "Fresh Sweet Curd",
      category: "Cooling Side",
      expectedEaters: 140,
      manualOffset: 0,
      unit: "bowls",
      isPopularFavorite: false,
      modelType: "baseline",
      reasons: [
        "Popular soothing side during warm afternoon meal times",
        "Pre-portioned in small bowls to reduce avoidable waste",
      ],
    },
  ],
  dinner: [
    {
      id: "d_chicken_dinner",
      name: "Chicken Curry / Soya Chaap",
      category: "Main Curry",
      expectedEaters: 158,
      manualOffset: 0,
      unit: "plates",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "170 students expected for Sunday dinner",
        "Peak attendance dish: Sunday dinner has the lowest absentee rate",
        "Safety cushion strictly recommended to avoid student shortage",
      ],
    },
    {
      id: "d_rajma",
      name: "Punjabi Rajma Masala",
      category: "Comfort Curry",
      expectedEaters: 145,
      manualOffset: 0,
      unit: "bowls",
      isPopularFavorite: false,
      modelType: "ai",
      reasons: [
        "Strong pairing with jeera rice for vegetarian diners",
        "Consistent 85% pick rate on Sunday dinner rotations",
      ],
    },
    {
      id: "d_jeera_rice",
      name: "Aromatic Jeera Rice",
      category: "Rice Staple",
      expectedEaters: 160,
      manualOffset: 0,
      unit: "portions",
      isPopularFavorite: false,
      modelType: "ai",
      reasons: [
        "Standard weekend dinner staple",
        "Calibrated portion sizes prevent end-of-night pot leftovers",
      ],
    },
    {
      id: "d_roti_dinner",
      name: "Tandoori Butter Roti",
      category: "Fresh Breads",
      expectedEaters: 380,
      manualOffset: 0,
      unit: "pieces",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "Average 2.3 rotis per student during evening meal",
        "Safety buffer adds 31 rotis to cover late arrivals from the library",
      ],
    },
    {
      id: "d_gulab_jamun",
      name: "Warm Gulab Jamun",
      category: "Weekend Dessert",
      expectedEaters: 170,
      manualOffset: 0,
      unit: "pieces",
      isPopularFavorite: true,
      modelType: "ai",
      reasons: [
        "Sunday evening treat — near 100% attendance rate for dessert",
        "Prepared strictly 1 per attending student plus kitchen cushion",
      ],
    },
  ],
};

export default function DashboardPage() {
  const [activeShift, setActiveShift] = useState<MealShiftKey>("lunch");
  const [safetyBuffer, setSafetyBuffer] = useState<number>(0.08);
  const [viewDensity, setViewDensity] = useState<ViewDensity>("cards");
  const [dishesByShift, setDishesByShift] =
    useState<Record<MealShiftKey, DishItem[]>>(INITIAL_DISH_DATA);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDishExplaining, setSelectedDishExplaining] =
    useState<DishItem | null>(null);

  // Calculate final recommended cooking quantity for a dish item
  const calculatePrep = (item: DishItem, bufferPct: number): number => {
    const rawWithBuffer = Math.ceil(item.expectedEaters * (1 + bufferPct));
    const finalVal = rawWithBuffer + item.manualOffset;
    return Math.max(0, finalVal);
  };

  // Compute total cooking portions across all 3 shifts
  const overallDayPortions = useMemo(() => {
    let sum = 0;
    (Object.keys(dishesByShift) as MealShiftKey[]).forEach((shiftKey) => {
      dishesByShift[shiftKey].forEach((dish) => {
        sum += calculatePrep(dish, safetyBuffer);
      });
    });
    return sum;
  }, [dishesByShift, safetyBuffer]);

  // Compute current shift total portions
  const currentShiftPortions = useMemo(() => {
    return dishesByShift[activeShift].reduce((sum, dish) => {
      return sum + calculatePrep(dish, safetyBuffer);
    }, 0);
  }, [dishesByShift, activeShift, safetyBuffer]);

  // Increment or decrement portions for a specific dish
  const handleAdjustPortion = (dishId: string, delta: number) => {
    setDishesByShift((prev) => {
      const currentList = prev[activeShift];
      const updatedList = currentList.map((dish) => {
        if (dish.id !== dishId) return dish;
        const currentRecommended = calculatePrep(dish, safetyBuffer);
        if (currentRecommended + delta < 0) return dish;
        return {
          ...dish,
          manualOffset: dish.manualOffset + delta,
        };
      });
      return {
        ...prev,
        [activeShift]: updatedList,
      };
    });
    setIsApproved(false);
  };

  // Reset shift dishes back to original recommendations
  const handleResetShift = () => {
    setDishesByShift((prev) => ({
      ...prev,
      [activeShift]: INITIAL_DISH_DATA[activeShift].map((d) => ({
        ...d,
        manualOffset: 0,
      })),
    }));
    setIsApproved(false);
    showToast("Reset shift to original smart recommendations.");
  };

  // Approve and lock tomorrow's plan
  const handleApprovePlan = () => {
    setIsApproved(true);
    showToast("Tomorrow's cooking plan is confirmed and locked! Kitchen team notified.");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const currentShiftMeta = SHIFT_CONFIGS.find((s) => s.key === activeShift)!;
  const currentDishes = dishesByShift[activeShift];

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Preserved Unmodified Sidebar */}
        <Sidebar />

        <main className="flex-1 p-4 sm:p-7 max-w-[1580px] mx-auto w-full space-y-6">
          {/* Top Header with Date & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-line-light/60">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-forest text-lime">
                  Daily Cooking Command
                </span>
                <span className="text-xs font-semibold text-ink-secondary">
                  Sunday, 18 October 2026 · Sreenidhi Central Mess
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
                Tomorrow’s Kitchen Plan
              </h1>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                onClick={handleResetShift}
                type="button"
                className="px-3.5 py-2 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Reset active shift dishes to AI baseline"
              >
                <RefreshCw size={13} className="text-ink-secondary" />
                <span>Reset Shift</span>
              </button>

              <button
                onClick={handleApprovePlan}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm active:scale-95 ${
                  isApproved
                    ? "bg-sage text-forest border border-forest/20"
                    : "bg-forest text-lime hover:bg-forest-dark border border-line-dark shadow-lime/20"
                }`}
              >
                <CheckCircle2 size={15} />
                <span>{isApproved ? "Plan Confirmed ✓" : "Confirm Plan"}</span>
              </button>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-forest text-lime border border-lime/30 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg transition-all animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-lime shrink-0" />
                <span className="text-white">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs text-lime hover:text-lime-soft font-bold underline ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* MAIN WORKSPACE: AWARD-WINNING RESIZABLE SPLIT LAYOUT */}
          <ResizableLayout
            leftChild={
              <div className="space-y-5">
                {/* 1. Meal Shift Switcher & View Density Bar */}
                <div className="p-3 rounded-2xl bg-white border border-line-light shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Shift Selection Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {SHIFT_CONFIGS.map((shift) => {
                      const Icon = shift.icon;
                      const isSelected = activeShift === shift.key;
                      const shiftSum = dishesByShift[shift.key].reduce(
                        (sum, d) => sum + calculatePrep(d, safetyBuffer),
                        0
                      );

                      return (
                        <button
                          key={shift.key}
                          onClick={() => setActiveShift(shift.key)}
                          type="button"
                          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 ${
                            isSelected
                              ? "bg-forest text-white shadow-sm ring-1 ring-lime/40"
                              : "bg-canvas text-ink hover:bg-line-light/60 text-ink-secondary"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? "bg-lime text-forest-dark font-black"
                                : "bg-white text-ink-secondary"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="text-left">
                            <span className="block leading-tight font-black">
                              {shift.label}
                            </span>
                            <span
                              className={`text-[10px] block leading-tight font-normal ${
                                isSelected ? "text-lime" : "text-ink-secondary"
                              }`}
                            >
                              {shiftSum} portions
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* View Density Switcher (Cards vs Compact Sheet) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-line-light/60">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-secondary mr-1">
                      VIEW
                    </span>
                    <div className="flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line-light">
                      <button
                        onClick={() => setViewDensity("cards")}
                        type="button"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          viewDensity === "cards"
                            ? "bg-forest text-lime shadow-sm"
                            : "text-ink-secondary hover:text-ink hover:bg-white"
                        }`}
                      >
                        <LayoutGrid size={13} />
                        <span>Cards</span>
                      </button>
                      <button
                        onClick={() => setViewDensity("compact")}
                        type="button"
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          viewDensity === "compact"
                            ? "bg-forest text-lime shadow-sm"
                            : "text-ink-secondary hover:text-ink hover:bg-white"
                        }`}
                      >
                        <List size={13} />
                        <span>Compact Sheet</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Shift Header Summary Bar */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-lg font-black text-ink flex items-center gap-2">
                      <span>{currentShiftMeta.label} Preparation Line</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sage text-forest">
                        {currentShiftMeta.timeWindow}
                      </span>
                    </h2>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Targeting ~{currentShiftMeta.expectedHeadcount} attending students ·{" "}
                      <strong className="text-ink">
                        {currentShiftPortions} total portions
                      </strong>{" "}
                      scheduled to cook
                    </p>
                  </div>

                  <span className="text-xs font-extrabold text-forest bg-sage px-2.5 py-1 rounded-xl">
                    {currentDishes.length} Dishes
                  </span>
                </div>

                {/* 2. DISHES DISPLAY: CARDS OR COMPACT LINE VIEW */}
                {viewDensity === "cards" ? (
                  /* --- OPTION A: CHEF CARDS VIEW (Visual High-Impact) --- */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentDishes.map((dish) => {
                      const prepTotal = calculatePrep(dish, safetyBuffer);
                      const bufferAdd = prepTotal - dish.expectedEaters;

                      return (
                        <div
                          key={dish.id}
                          className="p-5 rounded-3xl bg-white border border-line-light shadow-sm hover:border-forest/30 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Card Top: Category, Popular Tag & Model Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-canvas text-ink-secondary uppercase tracking-wider">
                                {dish.category}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {dish.isPopularFavorite && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                    <Flame size={11} className="text-amber-500" />
                                    <span>Campus Favorite</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage text-forest flex items-center gap-1">
                                  <Sparkles size={11} className="text-forest" />
                                  <span>
                                    {dish.modelType === "ai"
                                      ? "Smart Forecast"
                                      : "Past Baseline"}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Dish Name */}
                            <h3 className="text-base font-black text-ink group-hover:text-forest transition-colors">
                              {dish.name}
                            </h3>

                            {/* HIGH ATTENTION BOX: HOW MUCH TO COOK (Forest + Electric Lime) */}
                            <div className="mt-3.5 p-3.5 rounded-2xl bg-forest text-white border border-line-dark flex items-center justify-between shadow-md">
                              <div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-lime block">
                                  COOK THIS MANY
                                </span>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-3xl font-black text-white tracking-tight">
                                    {prepTotal}
                                  </span>
                                  <span className="text-xs font-bold text-lime">
                                    {dish.unit}
                                  </span>
                                </div>
                              </div>

                              {/* Tactile In-line Stepper Controls */}
                              <div className="flex items-center gap-1 bg-forest-dark/90 p-1 rounded-xl border border-white/10">
                                <button
                                  onClick={() => handleAdjustPortion(dish.id, -5)}
                                  type="button"
                                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all"
                                  title="Cook 5 fewer"
                                >
                                  <Minus size={13} />
                                </button>

                                <span
                                  className={`text-[11px] font-black px-1.5 text-center min-w-[28px] ${
                                    dish.manualOffset === 0
                                      ? "text-white/60"
                                      : dish.manualOffset > 0
                                      ? "text-lime"
                                      : "text-amber-300"
                                  }`}
                                >
                                  {dish.manualOffset === 0
                                    ? "AI"
                                    : dish.manualOffset > 0
                                    ? `+${dish.manualOffset}`
                                    : dish.manualOffset}
                                </span>

                                <button
                                  onClick={() => handleAdjustPortion(dish.id, 5)}
                                  type="button"
                                  className="w-8 h-8 rounded-lg bg-lime hover:bg-lime-soft active:scale-90 text-forest-dark font-black flex items-center justify-center transition-all shadow-sm"
                                  title="Cook 5 more"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Proportion Bar: Base Appetite vs Safety Cushion */}
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                                <span>
                                  Expected students:{" "}
                                  <strong className="text-ink">
                                    {dish.expectedEaters}
                                  </strong>
                                </span>
                                <span className="font-semibold text-forest">
                                  Safety cushion:{" "}
                                  <strong className="text-forest">
                                    +{bufferAdd} {dish.unit}
                                  </strong>
                                </span>
                              </div>

                              <div className="w-full h-2 rounded-full bg-canvas overflow-hidden flex">
                                <div
                                  className="bg-forest h-full"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (dish.expectedEaters / prepTotal) * 100
                                    )}%`,
                                  }}
                                  title={`Base Demand: ${dish.expectedEaters}`}
                                />
                                <div
                                  className="bg-lime h-full"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      100 - (dish.expectedEaters / prepTotal) * 100
                                    )}%`,
                                  }}
                                  title={`Safety Buffer: +${bufferAdd}`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Customer-Friendly "Why this number?" Button */}
                          <div className="mt-4 pt-3 border-t border-line-light/70 flex items-center justify-between">
                            <button
                              onClick={() => setSelectedDishExplaining(dish)}
                              type="button"
                              className="text-xs font-bold text-forest hover:text-forest-dark flex items-center gap-1.5 transition-colors"
                            >
                              <HelpCircle size={13} className="text-forest" />
                              <span>Why this number?</span>
                            </button>

                            <span className="text-[10px] text-ink-secondary font-medium">
                              {dish.reasons.length} factors considered
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* --- OPTION B: COMPACT LINE SHEET (All Dishes at a Glance) --- */
                  <div className="rounded-3xl bg-white border border-line-light shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-canvas border-b border-line-light text-ink-secondary font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Dish & Category</th>
                            <th className="py-3 px-3">Base Demand</th>
                            <th className="py-3 px-3">Cushion</th>
                            <th className="py-3 px-4 text-center">To Cook</th>
                            <th className="py-3 px-3 text-right">Adjust</th>
                            <th className="py-3 px-3 text-center">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-light/60">
                          {currentDishes.map((dish) => {
                            const prepTotal = calculatePrep(dish, safetyBuffer);
                            const bufferAdd = prepTotal - dish.expectedEaters;

                            return (
                              <tr
                                key={dish.id}
                                className="hover:bg-canvas/50 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-black text-ink text-sm">
                                      {dish.name}
                                    </span>
                                    {dish.isPopularFavorite && (
                                      <span className="p-0.5 rounded bg-amber-50 text-amber-600">
                                        <Flame size={11} />
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-ink-secondary">
                                    {dish.category} · {dish.unit}
                                  </span>
                                </td>

                                <td className="py-3 px-3 font-semibold text-ink">
                                  {dish.expectedEaters}
                                </td>

                                <td className="py-3 px-3 font-bold text-forest">
                                  +{bufferAdd}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  <span className="px-3 py-1 rounded-xl bg-forest text-lime font-black text-sm inline-block shadow-sm">
                                    {prepTotal} {dish.unit}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right">
                                  <div className="inline-flex items-center gap-1 bg-canvas p-1 rounded-xl border border-line-light">
                                    <button
                                      onClick={() =>
                                        handleAdjustPortion(dish.id, -5)
                                      }
                                      type="button"
                                      className="w-6 h-6 rounded-lg bg-white hover:bg-line-light text-ink flex items-center justify-center font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="text-[10px] font-black px-1">
                                      {dish.manualOffset === 0
                                        ? "AI"
                                        : dish.manualOffset > 0
                                        ? `+${dish.manualOffset}`
                                        : dish.manualOffset}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleAdjustPortion(dish.id, 5)
                                      }
                                      type="button"
                                      className="w-6 h-6 rounded-lg bg-lime hover:bg-lime-soft text-forest-dark flex items-center justify-center font-black"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => setSelectedDishExplaining(dish)}
                                    type="button"
                                    className="p-1.5 rounded-lg text-ink-secondary hover:text-forest hover:bg-sage transition-colors"
                                    title="View explanation reasons"
                                  >
                                    <HelpCircle size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            }
            rightChild={
              /* RIGHT PANE: KITCHEN INTELLIGENCE, SAFETY CUSHION & IMPACT */
              <div className="space-y-5">
                {/* 1. CONFIRM PLAN COMMAND CARD (High Visual Attention) */}
                <div className="p-6 rounded-3xl bg-forest text-white border border-line-dark shadow-xl relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-48 h-48 bg-lime/15 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-lime">
                      OVERALL COOKING TOTAL
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1.5 ${
                        isApproved
                          ? "bg-lime text-forest-dark"
                          : "bg-white/10 text-lime border border-lime/30"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isApproved ? "bg-forest-dark" : "bg-lime animate-pulse"
                        }`}
                      />
                      <span>
                        {isApproved ? "PLAN CONFIRMED ✓" : "NEEDS APPROVAL"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {overallDayPortions.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-lime">
                      Total Portions (All 3 Shifts)
                    </span>
                  </div>

                  <p className="text-xs text-white/75 mt-2 leading-relaxed">
                    Based on predicted attendance + your{" "}
                    <strong className="text-lime">
                      +{Math.round(safetyBuffer * 100)}% extra safety cushion
                    </strong>
                    . Ensures zero food shortage.
                  </p>

                  <button
                    onClick={handleApprovePlan}
                    type="button"
                    className={`mt-5 w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                      isApproved
                        ? "bg-white/15 text-white hover:bg-white/20 border border-white/20"
                        : "bg-lime text-forest-dark hover:bg-lime-soft shadow-lime/25"
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {isApproved
                        ? "Plan Confirmed (Click to Re-confirm)"
                        : "Confirm Tomorrow's Cooking Plan"}
                    </span>
                  </button>
                </div>

                {/* 2. SAFETY CUSHION CONTROL CARD (Customer-Friendly Slider/Pills) */}
                <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sage text-forest flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-ink">
                        Safety Cushion Control
                      </h3>
                      <p className="text-xs text-ink-secondary">
                        How much extra food should we prepare as backup?
                      </p>
                    </div>
                  </div>

                  {/* Buffer Pill Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {BUFFER_PRESETS.map((preset) => {
                      const isActive = safetyBuffer === preset.value;
                      return (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setSafetyBuffer(preset.value);
                            setIsApproved(false);
                          }}
                          type="button"
                          className={`p-3 rounded-2xl text-left border transition-all ${
                            isActive
                              ? "bg-forest text-white border-forest shadow-sm"
                              : "bg-canvas text-ink border-line-light hover:border-forest/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-black ${
                                isActive ? "text-lime" : "text-ink"
                              }`}
                            >
                              {preset.label}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                isActive ? "text-white/60" : "text-ink-secondary"
                              }`}
                            >
                              {preset.title}
                            </span>
                          </div>
                          <p
                            className={`text-[10px] mt-1 leading-snug ${
                              isActive ? "text-white/80" : "text-ink-secondary"
                            }`}
                          >
                            {preset.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. AI EXPLANATION HIGHLIGHTS (No Technical Jargon) */}
                <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-forest">
                      WHY THESE QUANTITIES?
                    </span>
                    <span className="text-[10px] font-bold text-ink-secondary">
                      {currentShiftMeta.label} Insights
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-ink-secondary">
                    <div className="p-3 rounded-2xl bg-canvas border border-line-light flex items-start gap-2.5">
                      <Users size={16} className="text-forest shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink text-xs">
                          ~{currentShiftMeta.expectedHeadcount} Attending Students
                        </p>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Calculated from Sunday campus check-ins and hostel dining trends.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-canvas border border-line-light flex items-start gap-2.5">
                      <Sun size={16} className="text-forest shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink text-xs">
                          Sunday Dining Schedule
                        </p>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Weekend mornings have relaxed arrivals; dinner captures 92% turnout.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-canvas border border-line-light flex items-start gap-2.5">
                      <ShieldCheck size={16} className="text-forest shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-ink text-xs">
                          Zero Shortage Protection
                        </p>
                        <p className="text-[11px] text-ink-secondary mt-0.5">
                          Configured buffer adds safe margins so no student leaves empty-handed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. VERIFIED KITCHEN IMPACT METRICS */}
                <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-forest">
                    DAILY IMPACT & SAVINGS
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-sage/60 border border-line-light">
                      <div className="flex items-center gap-1.5 text-forest mb-1">
                        <Leaf size={14} />
                        <span className="text-[10px] font-extrabold uppercase">
                          Food Saved
                        </span>
                      </div>
                      <p className="text-xl font-black text-forest">~42.5 kg</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        Edible food prevented from waste
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-canvas border border-line-light">
                      <div className="flex items-center gap-1.5 text-ink mb-1">
                        <TrendingDown size={14} className="text-forest" />
                        <span className="text-[10px] font-extrabold uppercase">
                          Cost Saved
                        </span>
                      </div>
                      <p className="text-xl font-black text-ink">₹3,200</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        Reduced excess raw procurement
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-canvas border border-line-light">
                      <div className="flex items-center gap-1.5 text-ink mb-1">
                        <CheckCircle2 size={14} className="text-forest" />
                        <span className="text-[10px] font-extrabold uppercase">
                          Shortage Risk
                        </span>
                      </div>
                      <p className="text-xl font-black text-forest">0% (Safe)</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        Guaranteed meal availability
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-canvas border border-line-light">
                      <div className="flex items-center gap-1.5 text-ink mb-1">
                        <Sparkles size={14} className="text-forest" />
                        <span className="text-[10px] font-extrabold uppercase">
                          Accuracy
                        </span>
                      </div>
                      <p className="text-xl font-black text-ink">96.5%</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        Tested over 60 days of meals
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            }
          />

          {/* EXPLANATION MODAL / DRAWER (Customer-Friendly "Why this number?") */}
          {selectedDishExplaining && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
              onClick={() => setSelectedDishExplaining(null)}
            >
              <div
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-line-light space-y-4 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sage text-forest uppercase tracking-wider">
                      {selectedDishExplaining.category}
                    </span>
                    <h3 className="text-xl font-black text-ink mt-1">
                      {selectedDishExplaining.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedDishExplaining(null)}
                    className="p-1.5 rounded-xl bg-canvas hover:bg-line-light text-ink-secondary transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-forest text-white border border-line-dark flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-lime">
                      RECOMMENDED TO COOK
                    </span>
                    <p className="text-3xl font-black text-white mt-0.5">
                      {calculatePrep(selectedDishExplaining, safetyBuffer)}{" "}
                      <span className="text-xs font-bold text-lime">
                        {selectedDishExplaining.unit}
                      </span>
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/70">
                    <p>
                      Base Demand:{" "}
                      <strong className="text-white">
                        {selectedDishExplaining.expectedEaters}
                      </strong>
                    </p>
                    <p className="text-lime font-bold">
                      +{Math.round(safetyBuffer * 100)}% Safety Cushion
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-forest mb-2">
                    How We Derived This Recommendation:
                  </h4>
                  <div className="space-y-2">
                    {selectedDishExplaining.reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-canvas border border-line-light flex items-start gap-2.5 text-xs text-ink"
                      >
                        <span className="w-4 h-4 rounded-full bg-forest text-lime flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          ✓
                        </span>
                        <span className="leading-relaxed">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedDishExplaining(null)}
                    type="button"
                    className="w-full py-3 rounded-xl bg-forest text-white hover:bg-forest-dark font-bold text-xs transition-colors"
                  >
                    Got It, Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
