"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { DishPreparationTable } from "@/components/dashboard/DishPreparationTable";
import { KeyInsightsPanel } from "@/components/dashboard/KeyInsightsPanel";
import { DashboardActionBar } from "@/components/dashboard/DashboardActionBar";
import { EditQuantitiesModal } from "@/components/dashboard/EditQuantitiesModal";
import { DishItem, MealShiftKey } from "@/components/dashboard/types";

const INITIAL_DISHES_BY_SHIFT: Record<MealShiftKey, DishItem[]> = {
  lunch: [
    {
      id: "dish_rice",
      name: "Steamed Rice",
      category: "Staple Grain",
      imageEmoji: "🍚",
      imageBg: "bg-amber-50 border border-amber-200/60",
      predictedDemand: 60,
      recommendedQty: 65,
      unit: "portions",
      note: "Based on average demand for Tuesdays",
    },
    {
      id: "dish_dal",
      name: "Dal Tadka",
      category: "Lentil Curry",
      imageEmoji: "🍲",
      imageBg: "bg-yellow-50 border border-yellow-200/60",
      predictedDemand: 55,
      recommendedQty: 58,
      unit: "bowls",
      note: "Similar to last 4 weeks",
    },
    {
      id: "dish_mix_veg",
      name: "Mixed Vegetable",
      category: "Main Sabzi",
      imageEmoji: "🥗",
      imageBg: "bg-emerald-50 border border-emerald-200/60",
      predictedDemand: 35,
      recommendedQty: 38,
      unit: "plates",
      note: "Slightly lower expected demand",
    },
    {
      id: "dish_roti",
      name: "Roti",
      category: "Fresh Breads",
      imageEmoji: "🫓",
      imageBg: "bg-orange-50 border border-orange-200/60",
      predictedDemand: 50,
      recommendedQty: 52,
      unit: "pieces",
      note: "Based on attendance and menu pattern",
    },
  ],
  breakfast: [
    {
      id: "dish_idli",
      name: "Idli & Sambar",
      category: "Steamed Main",
      imageEmoji: "🥟",
      imageBg: "bg-slate-50 border border-slate-200/60",
      predictedDemand: 50,
      recommendedQty: 54,
      unit: "plates",
      note: "Consistent weekday breakfast preference",
    },
    {
      id: "dish_poha",
      name: "Indori Poha",
      category: "Light Breakfast",
      imageEmoji: "🌾",
      imageBg: "bg-amber-50 border border-amber-200/60",
      predictedDemand: 45,
      recommendedQty: 48,
      unit: "plates",
      note: "Turnout steady across last 3 weeks",
    },
    {
      id: "dish_dosa",
      name: "Masala Dosa",
      category: "Griddle Special",
      imageEmoji: "🥞",
      imageBg: "bg-yellow-50 border border-yellow-200/60",
      predictedDemand: 60,
      recommendedQty: 65,
      unit: "servings",
      note: "Highest breakfast pick on morning shift",
    },
    {
      id: "dish_chai",
      name: "Masala Chai & Coffee",
      category: "Hot Beverage",
      imageEmoji: "☕",
      imageBg: "bg-orange-50 border border-orange-200/60",
      predictedDemand: 65,
      recommendedQty: 70,
      unit: "cups",
      note: "0.95 cups per attending student benchmark",
    },
  ],
  dinner: [
    {
      id: "dish_chicken",
      name: "Chicken Curry / Soya Chaap",
      category: "Special Curry",
      imageEmoji: "🍗",
      imageBg: "bg-red-50 border border-red-200/60",
      predictedDemand: 58,
      recommendedQty: 62,
      unit: "plates",
      note: "Peak dinner attendance with lowest absentee rate",
    },
    {
      id: "dish_rajma",
      name: "Punjabi Rajma Masala",
      category: "Comfort Curry",
      imageEmoji: "🍛",
      imageBg: "bg-amber-50 border border-amber-200/60",
      predictedDemand: 48,
      recommendedQty: 52,
      unit: "bowls",
      note: "Consistent 85% pick rate with jeera rice",
    },
    {
      id: "dish_jeera_rice",
      name: "Aromatic Jeera Rice",
      category: "Staple Grain",
      imageEmoji: "🍚",
      imageBg: "bg-yellow-50 border border-yellow-200/60",
      predictedDemand: 55,
      recommendedQty: 58,
      unit: "portions",
      note: "Standard evening staple; minimal leftover variance",
    },
    {
      id: "dish_butter_roti",
      name: "Butter Roti",
      category: "Fresh Breads",
      imageEmoji: "🫓",
      imageBg: "bg-orange-50 border border-orange-200/60",
      predictedDemand: 85,
      recommendedQty: 90,
      unit: "pieces",
      note: "Buffer covers late evening arrivals from library",
    },
  ],
};

export default function DashboardPage() {
  const [selectedShift, setSelectedShift] = useState<MealShiftKey>("lunch");
  const [selectedDate, setSelectedDate] = useState<string>("Tue, 12 Aug 2025");
  const [dishesByShift, setDishesByShift] = useState<Record<MealShiftKey, DishItem[]>>(
    INITIAL_DISHES_BY_SHIFT
  );
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentDishes = dishesByShift[selectedShift];

  // Dynamic sums for metrics based on current dishes
  const estimatedDemandTotal = useMemo(() => {
    return currentDishes.reduce((sum, d) => sum + d.predictedDemand, 0);
  }, [currentDishes]);

  const recommendedPrepTotal = useMemo(() => {
    return currentDishes.reduce((sum, d) => sum + d.recommendedQty, 0);
  }, [currentDishes]);

  const handleShiftChange = (newShift: MealShiftKey) => {
    setSelectedShift(newShift);
    setIsConfirmed(false);
  };

  const handleConfirmPlan = () => {
    setIsConfirmed(true);
    setToastMessage("Tomorrow's preparation plan has been confirmed! Kitchen staff notified.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveDishes = (updatedDishes: DishItem[]) => {
    setDishesByShift((prev) => ({
      ...prev,
      [selectedShift]: updatedDishes,
    }));
    setIsConfirmed(false);
    setToastMessage("Cooking quantities updated successfully!");
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-sans selection:bg-lime selection:text-forest-dark">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Preserved Unmodified Sidebar */}
        <Sidebar />

        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-7">
          {/* 1. Header with Chef Greeting, Date Selector, and Shift Selector */}
          <DashboardHeader
            chefName="Sunil"
            selectedDate={selectedDate}
            selectedShift={selectedShift}
            onShiftChange={handleShiftChange}
            onDateChange={setSelectedDate}
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-forest text-lime border border-lime/30 text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg transition-all animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-lime shrink-0" />
                <span className="text-white">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs text-lime underline hover:text-lime-soft font-bold ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 2. Top Metric Cards: Estimated Demand, Recommended Prep, Forecast Confidence */}
          <MetricCards
            estimatedDemand={estimatedDemandTotal}
            demandTrendText="5% lower than usual (similar Tuesdays)"
            recommendedPrep={recommendedPrepTotal}
            safetyBufferPct={5}
            confidenceLevel="High"
            confidencePct={88}
          />

          {/* 3. Middle Section: Dish-wise Preparation Plan Table + Key Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left Column (Dish Table): 8 of 12 cols (~67%) */}
            <div className="lg:col-span-8">
              <DishPreparationTable
                dishes={currentDishes}
                onViewFullMenu={() => setIsEditModalOpen(true)}
              />
            </div>

            {/* Right Column (Key Insights): 4 of 12 cols (~33%) */}
            <div className="lg:col-span-4">
              <KeyInsightsPanel />
            </div>
          </div>

          {/* 4. Bottom Action Bar: Edit Quantities & Confirm Preparation Plan */}
          <DashboardActionBar
            onEditQuantities={() => setIsEditModalOpen(true)}
            onConfirmPlan={handleConfirmPlan}
            isConfirmed={isConfirmed}
          />

          {/* Edit Quantities Modal */}
          <EditQuantitiesModal
            dishes={currentDishes}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveDishes}
          />
        </main>
      </div>
    </div>
  );
}
